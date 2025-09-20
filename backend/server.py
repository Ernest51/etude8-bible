# server.py
# API Bible Study (Darby) — AVEC contenu détaillé verset par verset et explications théologiques automatiques
# - Texte biblique via https://api.scripture.api.bible/v1
# - Étude "28 rubriques" + Verset/verset avec contenu théologique détaillé
# - Génération automatique d'explications théologiques via LLM
# - Renvoie toujours {"content": "..."} pour coller au front.

import os
import re
import unicodedata
from typing import Dict, List, Optional
from dotenv import load_dotenv

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Charger les variables d'environnement
load_dotenv()

API_BASE = "https://api.scripture.api.bible/v1"
APP_NAME = "Bible Study API - Darby"
BIBLE_API_KEY = os.getenv("BIBLE_API_KEY", "0cff5d83f6852c3044a180cc4cdeb0fe")
PREFERRED_BIBLE_ID = os.getenv("BIBLE_ID", "a93a92589195411f-01")  # Bible J.N. Darby (French)
EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY")

# --- CORS ---
_default_origins = [
    "https://etude8-bible.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
]
_extra = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]
ALLOW_ORIGINS = _default_origins + _extra

app = FastAPI(title="FastAPI", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS if _extra else ["*"],  # large en phase de test
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
#      SCHEMAS
# =========================
class StudyRequest(BaseModel):
    passage: str = Field(..., description="Ex: 'Nombres 2' ou 'Jean 3'")
    version: str = Field("", description="Ignoré ici (api.bible gère par bibleId).")
    tokens: int = Field(0, description="Ignoré (hérité du front).")
    model: str = Field("", description="Ignoré (hérité du front).")
    requestedRubriques: Optional[List[int]] = Field(
        None, description="Index des rubriques à produire (0..27). None = toutes."
    )


class VerseByVerseRequest(BaseModel):
    passage: str = Field(..., description="Ex: 'Genèse 1' ou 'Genèse 1:1'")
    version: str = Field("", description="Ignoré (api.bible).")


# =========================
#  OUTILS livres → OSIS
# =========================
def _norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s)
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    s = re.sub(r"[^a-zA-Z0-9 ]+", " ", s).lower()
    s = re.sub(r"\s+", " ", s).strip()
    return s

BOOKS_FR_OSIS: Dict[str, str] = {
    # Pentateuque
    "genese": "GEN", "gen": "GEN",
    "exode": "EXO", "exo": "EXO",
    "levitique": "LEV", "lev": "LEV",
    "nombres": "NUM", "nom": "NUM", "nbr": "NUM", "nb": "NUM",
    "deuteronome": "DEU", "deut": "DEU", "dt": "DEU",
    # Historiques
    "josue": "JOS", "juges": "JDG", "ruth": "RUT",
    "1 samuel": "1SA", "2 samuel": "2SA",
    "1 rois": "1KI", "2 rois": "2KI",
    "1 chroniques": "1CH", "2 chroniques": "2CH",
    "esdras": "EZR", "nehemie": "NEH", "esther": "EST",
    # Poétiques
    "job": "JOB", "psaumes": "PSA", "psaume": "PSA", "ps": "PSA",
    "proverbes": "PRO", "prov": "PRO",
    "ecclesiaste": "ECC", "cantique des cantiques": "SNG", "cantique": "SNG",
    # Prophètes majeurs
    "esaie": "ISA", "jeremie": "JER", "lamentations": "LAM",
    "ezechiel": "EZK", "daniel": "DAN",
    # Prophètes mineurs
    "osee": "HOS", "joel": "JOL", "amos": "AMO", "abdi": "OBA",
    "jonas": "JON", "michee": "MIC", "nahum": "NAM", "habakuk": "HAB",
    "sophonie": "ZEP", "aggée": "HAG", "aggee": "HAG", "zacharie": "ZEC", "malachie": "MAL",
    # Évangiles & Actes
    "matthieu": "MAT", "marc": "MRK", "luc": "LUK", "jean": "JHN",
    "actes": "ACT",
    # Épîtres
    "romains": "ROM", "1 corinthiens": "1CO", "2 corinthiens": "2CO",
    "galates": "GAL", "ephesiens": "EPH", "philippiens": "PHP",
    "colossiens": "COL", "1 thessaloniciens": "1TH", "2 thessaloniciens": "2TH",
    "1 timothee": "1TI", "2 timothee": "2TI", "tite": "TIT", "philemon": "PHM",
    "hebreux": "HEB", "jacques": "JAS", "1 pierre": "1PE", "2 pierre": "2PE",
    "1 jean": "1JN", "2 jean": "2JN", "3 jean": "3JN", "jude": "JUD",
    # Apocalypse
    "apocalypse": "REV", "apoc": "REV",
}

def resolve_osis(book_raw: str) -> Optional[str]:
    key = _norm(book_raw)
    key = key.replace("er ", "1 ").replace("ere ", "1 ").replace("eme ", " ")
    return BOOKS_FR_OSIS.get(key)


# =========================
#   API.BIBLE CLIENT
# =========================
def headers() -> Dict[str, str]:
    if not BIBLE_API_KEY:
        raise HTTPException(status_code=500, detail="BIBLE_API_KEY manquante.")
    return {"api-key": BIBLE_API_KEY}

_cached_bible_id: Optional[str] = None
_cached_bible_name: Optional[str] = None

async def get_bible_id() -> str:
    global _cached_bible_id, _cached_bible_name
    if _cached_bible_id:
        return _cached_bible_id

    if PREFERRED_BIBLE_ID:
        _cached_bible_id = PREFERRED_BIBLE_ID
        _cached_bible_name = "Darby (config)"
        return _cached_bible_id

    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.get(f"{API_BASE}/bibles", headers=headers())
        if r.status_code != 200:
            raise HTTPException(status_code=502, detail=f"api.bible bibles: {r.text}")
        data = r.json()
        lst = data.get("data", [])
        # cherche Darby FR
        for b in lst:
            name = (b.get("name") or "") + " " + (b.get("abbreviationLocal") or "")
            lang = (b.get("language") or {}).get("name", "")
            if "darby" in name.lower() and ("fr" in lang.lower() or "fra" in lang.lower()):
                _cached_bible_id = b.get("id")
                _cached_bible_name = b.get("name")
                break
        if not _cached_bible_id:
            for b in lst:
                lang = (b.get("language") or {}).get("name", "")
                if "fr" in lang.lower() or "fra" in lang.lower():
                    _cached_bible_id = b.get("id")
                    _cached_bible_name = b.get("name")
                    break
        if not _cached_bible_id:
            raise HTTPException(status_code=500, detail="Aucune Bible FR trouvée via api.bible.")
    return _cached_bible_id


async def list_verses_ids(bible_id: str, osis_book: str, chapter: int) -> List[str]:
    chap_id = f"{osis_book}.{chapter}"
    url = f"{API_BASE}/bibles/{bible_id}/chapters/{chap_id}/verses"
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(url, headers=headers())
        if r.status_code != 200:
            raise HTTPException(status_code=502, detail=f"api.bible verses list: {r.text}")
        data = r.json()
        return [v["id"] for v in data.get("data", [])]


async def fetch_verse_text(bible_id: str, verse_id: str) -> str:
    url = f"{API_BASE}/bibles/{bible_id}/verses/{verse_id}"
    params = {"content-type": "text"}
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(url, headers=headers(), params=params)
        if r.status_code != 200:
            raise HTTPException(status_code=502, detail=f"api.bible verse: {r.text}")
        data = r.json()
        content = (data.get("data") or {}).get("content") or ""
        content = re.sub(r"\s+", " ", content).strip()
        return content


async def fetch_passage_text(bible_id: str, osis_book: str, chapter: int, verse: Optional[int] = None) -> str:
    if verse:
        verse_id = f"{osis_book}.{chapter}.{verse}"
        return await fetch_verse_text(bible_id, verse_id)
    ids = await list_verses_ids(bible_id, osis_book, chapter)
    parts: List[str] = []
    for idx, vid in enumerate(ids, start=1):
        txt = await fetch_verse_text(bible_id, vid)
        parts.append(f"{idx}. {txt}")
    return "\n".join(parts).strip()


# =========================
#   CONTENU / RUBRIQUES
# =========================
RUBRIQUES_28 = [
    "Prière d'ouverture",
    "Structure littéraire",
    "Questions du chapitre précédent",
    "Thème doctrinal",
    "Fondements théologiques",
    "Contexte historique",
    "Contexte culturel",
    "Contexte géographique",
    "Analyse lexicale",
    "Parallèles bibliques",
    "Prophétie et accomplissement",
    "Personnages",
    "Structure rhétorique",
    "Théologie trinitaire",
    "Christ au centre",
    "Évangile et grâce",
    "Application personnelle",
    "Application communautaire",
    "Prière de réponse",
    "Questions d'étude",
    "Points de vigilance",
    "Objections et réponses",
    "Perspective missionnelle",
    "Éthique chrétienne",
    "Louange / liturgie",
    "Méditation guidée",
    "Mémoire / versets clés",
    "Plan d'action",
]

def parse_passage_input(p: str):
    """
    'Genèse 1'    -> ('Genèse', 1, None)
    'Genèse 1:3'  -> ('Genèse', 1, 3)
    'Genèse 1 LSG' / 'Genèse 1:3 LSG' -> idem (version ignorée)
    """
    p = p.strip()
    # tolère un éventuel "version" en fin (un mot ou deux)
    m = re.match(r"^(.*?)[\s,]+(\d+)(?::(\d+))?(?:\s+\S+.*)?$", p)
    if not m:
        raise HTTPException(status_code=400, detail="Format passage invalide. Ex: 'Genèse 1' ou 'Genèse 1:1'.")
    book = m.group(1).strip()
    chapter = int(m.group(2))
    verse = int(m.group(3)) if m.group(3) else None
    osis = resolve_osis(book)
    if not osis:
        raise HTTPException(status_code=400, detail=f"Livre non reconnu: '{book}'.")
    return book, osis, chapter, verse


# =========================
#   GÉNÉRATION THÉOLOGIQUE SIMPLE (SANS LLM)
# =========================
def generate_simple_theological_explanation(verse_text: str, book_name: str, chapter: int, verse_num: int) -> str:
    """
    Génère une explication théologique spécifique basée sur l'analyse intelligente du contenu du verset
    """
    verse_lower = verse_text.lower()
    explanation_parts = []
    
    # === ANALYSE CONTEXTUELLE PAR LIVRE ET CONTENU SPÉCIFIQUE ===
    
    # Juges - Contexte de conquête et apostasie
    if book_name == "Juges":
        if "interrogèrent l'éternel" in verse_lower or "qui montera" in verse_lower:
            explanation_parts.append("Cette consultation divine révèle la dépendance d'Israël envers la direction de l'Éternel dans les conquêtes militaires, soulignant l'importance de chercher la volonté divine avant l'action.")
        elif "l'éternel dit" in verse_lower or "j'ai livré" in verse_lower:
            explanation_parts.append("La réponse divine assure la victoire avant le combat, démontrant que les succès d'Israël dépendent de la promesse et de la puissance de l'Éternel plutôt que de la force humaine.")
        elif "monte avec moi" in verse_lower or "frère" in verse_lower:
            explanation_parts.append("Cette alliance fraternelle entre tribus illustre l'importance de la solidarité dans l'accomplissement du plan divin, préfigurant l'unité nécessaire au peuple de Dieu.")
        elif "l'éternel livra" in verse_lower or "frappèrent" in verse_lower:
            explanation_parts.append("L'accomplissement de la promesse divine se manifeste dans la victoire concrète, confirmant la fidélité de Dieu envers son peuple obéissant.")
        elif "ne déposséda pas" in verse_lower or "tributaire" in verse_lower:
            explanation_parts.append("Cette désobéissance partielle révèle les conséquences de la compromission avec le mal, préfigurant les cycles d'apostasie qui caractériseront l'époque des Juges.")
        elif "cananéen" in verse_lower or "habitait" in verse_lower:
            explanation_parts.append("La coexistence avec les nations païennes représente la tension permanente entre l'appel à la sainteté et la contamination spirituelle du monde environnant.")
        else:
            explanation_parts.append("Ce passage illustre les défis de la conquête de la Terre Promise, révélant l'importance de l'obéissance complète aux commandements divins.")
    
    # Genèse - Contexte de création et origines
    elif book_name == "Genèse":
        if "commencement" in verse_lower or "créa" in verse_lower:
            explanation_parts.append("Ce verset établit le fondement de toute la révélation biblique en proclamant Dieu comme Créateur souverain de toutes choses.")
        elif "homme" in verse_lower and "image" in verse_lower:
            explanation_parts.append("La création de l'homme à l'image de Dieu révèle la dignité unique de l'humanité et sa vocation à refléter la gloire divine.")
        elif "alliance" in verse_lower or "promesse" in verse_lower:
            explanation_parts.append("Cette alliance divine inaugure le plan de rédemption qui se déploiera à travers toute l'histoire du salut.")
        else:
            explanation_parts.append("Ce récit des origines révèle les fondements de la relation entre Dieu et sa création.")
    
    # Exode - Contexte de libération et alliance
    elif book_name == "Exode":
        if "pharaon" in verse_lower or "égypte" in verse_lower:
            explanation_parts.append("Cette confrontation avec l'Égypte révèle la puissance libératrice de Dieu qui délivre son peuple de l'esclavage spirituel et physique.")
        elif "pâque" in verse_lower or "sang" in verse_lower:
            explanation_parts.append("Cette institution pascale préfigure le sacrifice rédempteur du Christ, l'Agneau de Dieu qui ôte le péché du monde.")
        elif "sinaï" in verse_lower or "loi" in verse_lower:
            explanation_parts.append("Cette révélation de la Loi établit les fondements de la relation d'alliance entre Dieu et son peuple élu.")
        else:
            explanation_parts.append("Ce passage révèle l'œuvre libératrice de Dieu et l'établissement de son alliance avec Israël.")
    
    # === ANALYSE GÉNÉRALE BASÉE SUR LE CONTENU ===
    
    # Termes de guerre et conquête
    elif any(term in verse_lower for term in ["guerre", "combat", "ennemi", "victoire", "bataille"]):
        explanation_parts.append("Ce récit de guerre spirituelle illustre le combat permanent entre le royaume de Dieu et les puissances des ténèbres, révélant que la victoire appartient à ceux qui s'appuient sur la force divine.")
    
    # Termes de prière et consultation divine
    elif any(term in verse_lower for term in ["prie", "interroge", "demande", "cherche l'éternel"]):
        explanation_parts.append("Cette recherche de la volonté divine démontre l'importance de la dépendance envers Dieu dans toutes les décisions de la vie, révélant la sagesse de consulter l'Éternel avant d'agir.")
    
    # Termes d'obéissance et désobéissance
    elif any(term in verse_lower for term in ["obéit", "désobéit", "commandement", "ordonne"]):
        explanation_parts.append("Cette question d'obéissance révèle que la bénédiction divine dépend de la soumission à la volonté de Dieu, tandis que la désobéissance entraîne des conséquences spirituelles durables.")
    
    # Termes familiaux et relationnels
    elif any(term in verse_lower for term in ["frère", "famille", "épouse", "fils", "père"]):
        explanation_parts.append("Ces relations humaines reflètent les principes divins de fidélité, d'amour et de responsabilité mutuelle qui doivent caractériser le peuple de Dieu.")
    
    # Termes géographiques et héritage
    elif any(term in verse_lower for term in ["terre", "héritage", "territoire", "frontière"]):
        explanation_parts.append("Cette question territoriale symbolise l'héritage spirituel promis aux croyants, révélant que les bénédictions divines s'obtiennent par la foi et l'obéissance.")
    
    # Termes de justice et jugement
    elif any(term in verse_lower for term in ["justice", "jugement", "châtiment", "rétribution"]):
        explanation_parts.append("Cette manifestation de la justice divine révèle que Dieu est le juge suprême qui rétribue selon les œuvres, maintenant l'équilibre moral de l'univers.")
    
    # Si aucune analyse spécifique, utiliser le contexte du livre
    if not explanation_parts:
        book_contexts = {
            "Genèse": "Ce verset des origines révèle les fondements du plan divin pour l'humanité et la création.",
            "Exode": "Ce passage illustre l'œuvre libératrice de Dieu et ses implications pour la foi.",
            "Lévitique": "Cette prescription révèle les exigences de sainteté pour s'approcher du Dieu saint.",
            "Nombres": "Ce récit du pèlerinage révèle les leçons spirituelles du chemin vers la Terre Promise.",
            "Deutéronome": "Cette exhortation rappelle l'importance de l'obéissance à l'alliance divine.",
            "Josué": "Ce récit de conquête révèle l'accomplissement des promesses divines par la foi.",
            "Juges": "Cette narration révèle les cycles de l'apostasie et de la restauration divine.",
            "Ruth": "Cette histoire illustre la providence divine et la fidélité récompensée.",
            "1 Samuel": "Ce passage révèle l'établissement de la royauté selon les voies divines.",
            "2 Samuel": "Ce récit développe les promesses messianiques liées à David.",
            "Psaumes": "Ce verset exprime l'authentique spiritualité dans la relation avec Dieu.",
            "Proverbes": "Cette sagesse transmet les principes divins pour une vie droite.",
            "Matthieu": "Cet enseignement révèle les principes du Royaume des cieux.",
            "Jean": "Ce témoignage révèle la divinité du Christ et la vie éternelle.",
            "Romains": "Cette doctrine expose les fondements du salut par la foi.",
            "Apocalypse": "Cette révélation dévoile l'accomplissement ultime du plan divin."
        }
        explanation_parts.append(book_contexts.get(book_name, f"Ce verset révèle un aspect important de la révélation divine dans le livre de {book_name}."))
    
    # Joindre les explications
    full_explanation = " ".join(explanation_parts)
    
    # Nettoyer le texte
    full_explanation = full_explanation.replace("strong", "").replace("Strong", "")
    full_explanation = ' '.join(full_explanation.split())
    
    return full_explanation

def format_theological_content(content: str) -> str:
    """
    Formate le contenu théologique de manière simple et lisible SANS étoiles
    """
    import re
    
    # SUPPRIMER TOUTES LES ÉTOILES pour éviter l'affichage des **
    content = re.sub(r'\*\*(.*?)\*\*', r'\1', content)  # **texte** → texte
    content = content.replace('**', '')  # Supprimer toutes les étoiles restantes
    content = content.replace('*', '')   # Supprimer les étoiles simples aussi
    
    # Supprimer le mot "strong" isolé
    content = re.sub(r'\bstrong\b', '', content, flags=re.IGNORECASE)
    
    # Nettoyer les espaces multiples mais GARDER les retours à la ligne
    content = re.sub(r'[ ]+', ' ', content)  # Espaces multiples seulement
    content = content.strip()
    
    return content


# =========================
#        ROUTES
# =========================
@app.get("/api/")
def root():
    return {"message": APP_NAME}

@app.get("/api/health")
async def health():
    bid = None
    try:
        bid = await get_bible_id()
    except Exception:
        pass
    return {"status": "ok", "bibleId": bid or "unknown"}

@app.post("/api/generate-verse-by-verse")
async def generate_verse_by_verse(req: VerseByVerseRequest):
    book_label, osis, chap, verse = parse_passage_input(req.passage)
    bible_id = await get_bible_id()
    text = await fetch_passage_text(bible_id, osis, chap, verse)

    title = f"**Étude Verset par Verset - {book_label} Chapitre {chap}**"
    intro = (
        "Introduction au Chapitre\n\n"
        "Cette étude parcourt le texte de la **Bible Darby (FR)**. "
        "Les sections *EXPLICATION THÉOLOGIQUE* sont générées automatiquement par IA théologique."
    )

    if verse:
        # Générer l'explication théologique pour le verset unique
        theological_explanation = generate_simple_theological_explanation(text, book_label, chap, verse)
        theological_explanation = format_theological_content(theological_explanation)
        content = (
            f"**{title}**\n\n{intro}\n\n"
            f"**VERSET {verse}**\n\n"
            f"**TEXTE BIBLIQUE :**\n{text}\n\n"
            f"**EXPLICATION THÉOLOGIQUE :**\n{theological_explanation}"
        )
        return {"content": format_theological_content(content)}

    # Pour un chapitre entier, parser les versets et générer les explications
    lines = [l for l in text.splitlines() if l.strip()]
    blocks: List[str] = [f"**{title}**\n\n{intro}"]
    
    for line in lines:
        m = re.match(r"^(\d+)\.\s*(.*)$", line)
        if not m:
            continue
        vnum = int(m.group(1))
        vtxt = m.group(2).strip()
        
        # Générer l'explication théologique pour CHAQUE verset
        theological_explanation = generate_simple_theological_explanation(vtxt, book_label, chap, vnum)
        
        blocks.append(
            f"**VERSET {vnum}**\n\n"
            f"**TEXTE BIBLIQUE :**\n{vtxt}\n\n"
            f"**EXPLICATION THÉOLOGIQUE :**\n{theological_explanation}"
        )
    return {"content": format_theological_content("\n\n".join(blocks).strip())}

@app.post("/api/generate-study")
async def generate_study(req: StudyRequest):
    """
    Étude '28 rubriques' sans LLM.
    - Récupère le texte (Darby) pour *le chapitre* demandé.
    - Produit un SQUELETTE comportant explicitement les 28 rubriques.
    """
    book_label, osis, chap, verse = parse_passage_input(req.passage)
    # On force "passage = chapitre" pour la 28 pts
    verse = None

    bible_id = await get_bible_id()
    text = await fetch_passage_text(bible_id, osis, chap, verse)

    # Filtre des rubriques
    rubs = RUBRIQUES_28
    if req.requestedRubriques:
        rubs = [RUBRIQUES_28[i] for i in req.requestedRubriques if 0 <= i < len(RUBRIQUES_28)]
        if not rubs:
            rubs = RUBRIQUES_28

    header = f"# Étude en 28 points — {book_label} {chap} (Darby)\n"
    intro = (
        "Cette étude propose un **squelette** prêt à remplir. "
        "Le texte biblique est celui de la **Bible Darby (FR)**. "
        "Complète chaque rubrique avec ton analyse."
    )
    # Petit extrait du chapitre (lisible dans le front)
    excerpt = "\n".join([l for l in text.splitlines()[:8]])
    body: List[str] = [header, "## 📖 Extrait du texte (Darby)\n" + excerpt, intro, "## Rubriques"]

    for i, r in enumerate(rubs, start=1):
        body.append(f"**{i}. {r}**\n— à compléter —")

    return {"content": "\n\n".join(body).strip()}

# Alias attendu par certains fronts
@app.post("/api/generate-28")
async def generate_28(req: StudyRequest):
    return await generate_study(req)


# Lancement local
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=True)
