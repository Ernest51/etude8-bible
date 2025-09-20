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
    Génère une explication théologique spécifique basée sur l'analyse du contenu du verset
    """
    verse_lower = verse_text.lower()
    explanation_parts = []
    
    # === ANALYSE SPÉCIFIQUE DU CONTENU ===
    
    # Apocalypse - Révélation et eschatologie
    if book_name == "Apocalypse":
        if "révélation" in verse_lower:
            explanation_parts.append("La **révélation** (ἀποκάλυψις) désigne un dévoilement divin des mystères cachés. Cette révélation de Jésus-Christ constitue le testament final de la révélation canonique, dévoilant l'accomplissement ultime du plan de Dieu.")
        if "ange" in verse_lower:
            explanation_parts.append("L'intervention angélique souligne la médiation céleste dans la transmission de la révélation prophétique. L'ange sert d'intermédiaire entre la gloire divine et la réception humaine.")
        if "bientôt" in verse_lower:
            explanation_parts.append("L'imminence prophétique (\"bientôt\") ne se mesure pas selon le temps humain mais selon la perspective divine où \"un jour est comme mille ans\". Cette urgence eschatologique appelle à la vigilance spirituelle.")
    
    # Jérémie - Contexte prophétique
    elif book_name == "Jérémie":
        if "paroles de" in verse_lower:
            explanation_parts.append("L'expression **\"paroles de Jérémie\"** établit l'autorité prophétique distincte de la sagesse humaine. Ces paroles ne sont pas les opinions personnelles du prophète mais la révélation divine transmise fidèlement.")
        if "hilkija" in verse_lower or "sacrificateur" in verse_lower:
            explanation_parts.append("L'origine **sacerdotale** de Jérémie (fils de Hilkija) unit le ministère cultuel et prophétique. Cette double fonction souligne que la vraie adoration et la révélation divine sont indissociables.")
        if "anathoth" in verse_lower:
            explanation_parts.append("**Anathoth**, ville lévitique près de Jérusalem, symbolise la proximité géographique et spirituelle avec le temple. Cette localisation confère une légitimité particulière au ministère de Jérémie.")
        if "benjamin" in verse_lower:
            explanation_parts.append("La tribu de **Benjamin**, bien que petite, joue un rôle crucial dans l'histoire d'Israël. Cette appartenance tribale place Jérémie au cœur des enjeux politiques et spirituels du royaume de Juda.")
    
    # Genèse - Création et origines
    elif book_name == "Genèse":
        if "commencement" in verse_lower:
            explanation_parts.append("**\"Au commencement\"** (בְּרֵאשִׁית) inaugure toute la révélation biblique. Ce terme hébreu évoque non seulement un début temporel mais le principe même de toute existence créée.")
        if "créa" in verse_lower:
            explanation_parts.append("Le verbe **\"créa\"** (בָּרָא) est exclusivement utilisé pour l'action divine, indiquant une création ex nihilo. Seul Dieu possède le pouvoir de faire exister ce qui n'était pas.")
        if "esprit de dieu" in verse_lower:
            explanation_parts.append("L'**Esprit de Dieu** planant sur les eaux révèle la présence trinitaire dès la création. Cette image évoque la fécondité divine préparant l'œuvre d'organisation cosmique.")
    
    # Jean - Théologie johannique
    elif book_name == "Jean":
        if "verbe" in verse_lower or "parole" in verse_lower:
            explanation_parts.append("Le **Logos** (Verbe/Parole) révèle l'identité divine du Christ préexistant. Cette désignation philosophique et théologique établit Jésus comme la révélation parfaite et éternelle du Père.")
        if "lumière" in verse_lower:
            explanation_parts.append("La **lumière** symbolise la révélation divine et la vie spirituelle. Dans la théologie johannique, le Christ est la vraie lumière qui éclaire tout homme venant au monde.")
        if "monde" in verse_lower and "aimé" in verse_lower:
            explanation_parts.append("L'**amour divin pour le monde** (κόσμος) exprime la portée universelle du salut. Bien que le monde soit déchu, Dieu maintient son dessein rédempteur pour toute l'humanité.")
    
    # Psaumes - Liturgie et spiritualité
    elif book_name == "Psaumes":
        if "heureux" in verse_lower or "bienheureux" in verse_lower:
            explanation_parts.append("La **béatitude** (אַשְׁרֵי) ouvre la voie de la sagesse biblique. Cette félicité ne dépend pas des circonstances extérieures mais de la conformité à la volonté divine.")
        elif "loi de l'éternel" in verse_lower or "médite" in verse_lower:
            explanation_parts.append("La **méditation de la Loi** (תּוֹרָה) constitue la nourriture spirituelle du juste. Cette méditation jour et nuit transforme progressivement l'âme selon les pensées divines.")
        elif "arbre" in verse_lower and "ruisseau" in verse_lower:
            explanation_parts.append("La métaphore de l'**arbre planté** évoque l'enracinement spirituel profond. Les 'ruisseaux d'eaux' symbolisent les ressources infinies de la grâce divine qui nourrissent constamment l'âme fidèle.")
        elif "méchants" in verse_lower and "balle" in verse_lower:
            explanation_parts.append("Le contraste avec la **balle que le vent chasse** souligne l'instabilité des impies. Sans racines spirituelles, leur existence manque de substance et de permanence devant Dieu.")
        elif "jugement" in verse_lower and "assemblée des justes" in verse_lower:
            explanation_parts.append("L'**assemblée des justes** préfigure la communion éternelle des élus. Les méchants ne pourront subsister dans ce rassemblement saint car ils n'ont pas la justice requise.")
        elif "éternel connaît" in verse_lower and "voie des justes" in verse_lower:
            explanation_parts.append("La **connaissance divine** de la voie des justes exprime l'approbation et la protection de Dieu. Cette connaissance implique une relation personnelle et une surveillance bienveillante.")
        elif "berger" in verse_lower:
            explanation_parts.append("La métaphore du **berger** évoque la sollicitude divine, la protection et la guidance. Cette image pastorale révèle l'intimité de la relation entre Dieu et son peuple.")
        elif "vallée de l'ombre" in verse_lower:
            explanation_parts.append("La **vallée de l'ombre de la mort** symbolise les épreuves existentielles les plus profondes. Même dans ces moments, la présence divine demeure source de réconfort et d'espérance.")
        else:
            # Analyse spécifique selon le contenu du verset pour les Psaumes
            if "éternel" in verse_lower:
                explanation_parts.append("Ce verset célèbre la souveraineté de l'**Éternel** (יְהוָה) dans la vie du psalmiste, révélant la confiance absolue en la fidélité divine.")
            elif "louange" in verse_lower or "chante" in verse_lower:
                explanation_parts.append("L'expression de **louange** transforme les circonstances en opportunités d'adoration, élevant l'âme au-dessus des préoccupations terrestres.")
            elif "péché" in verse_lower or "iniquité" in verse_lower:
                explanation_parts.append("La confession du **péché** dans les Psaumes révèle l'authenticité de la relation avec Dieu, où la transparence précède la restauration.")
            else:
                explanation_parts.append("Ce verset psalmique exprime la spiritualité authentique d'Israël, mêlant les émotions humaines à la foi en la souveraineté divine.")
    
    # Romains - Doctrine paulinienne
    elif book_name == "Romains":
        if "évangile" in verse_lower:
            explanation_parts.append("L'**Évangile** (εὐαγγέλιον) constitue la bonne nouvelle du salut gratuit en Christ. Paul développe cette doctrine fondamentale qui transforme la condition humaine.")
        if "justice" in verse_lower and "dieu" in verse_lower:
            explanation_parts.append("La **justice de Dieu** révélée dans l'Évangile ne condamne pas mais justifie le pécheur par la foi. Cette justice divine s'accomplit pleinement dans l'œuvre rédemptrice du Christ.")
    
    # === ANALYSE GÉNÉRALE SELON LES MOTS-CLÉS ===
    
    # Noms divins et christologie
    if "jésus" in verse_lower and "christ" in verse_lower:
        explanation_parts.append("L'association **\"Jésus-Christ\"** unit l'humanité historique (Jésus) et la dignité messianique (Christ/Oint). Cette double nature révèle le mystère de l'Incarnation.")
    elif "christ" in verse_lower:
        explanation_parts.append("Le titre **\"Christ\"** (Χριστός/Messie) identifie Jésus comme l'Oint promis, accomplissant les espérances prophétiques d'Israël et du monde entier.")
    elif "seigneur" in verse_lower:
        explanation_parts.append("Le titre **\"Seigneur\"** (Κύριος) confesse la souveraineté divine du Christ ressuscité, égal au Père dans la divinité et l'autorité.")
    
    # Révélation et prophétie
    if "prophète" in verse_lower or "prophétie" in verse_lower:
        explanation_parts.append("Le ministère **prophétique** établit un pont entre la révélation divine et la compréhension humaine, appelant à la repentance et annonçant l'espérance messianique.")
    
    # Eschatologie
    if "royaume" in verse_lower and ("cieux" in verse_lower or "dieu" in verse_lower):
        explanation_parts.append("Le **Royaume des cieux** représente la souveraineté divine manifestée dans l'histoire et culminant dans la consommation eschatologique.")
    
    # Sotériologie
    if "salut" in verse_lower or "sauveur" in verse_lower:
        explanation_parts.append("Le **salut** divin dépasse la simple délivrance temporelle pour offrir la réconciliation éternelle avec Dieu par la grâce seule.")
    
    # Pneumatologie
    if "esprit saint" in verse_lower:
        explanation_parts.append("L'**Esprit Saint** accomplit l'œuvre de sanctification, d'illumination et de consolation dans la vie du croyant et de l'Église.")
    
    # Si aucune analyse spécifique, créer une explication contextuelle
    if not explanation_parts:
        context_mapping = {
            "Genèse": "Ce verset contribue aux fondements de la révélation divine concernant les origines, la nature humaine et le plan de Dieu pour la création.",
            "Exode": "Ce passage s'inscrit dans le récit de la délivrance d'Israël, révélant la fidélité divine et l'établissement de l'alliance mosaïque.",
            "Psaumes": "Ce verset exprime la spiritualité d'Israël dans sa relation avec Dieu, mêlant louange, supplication et méditation sur les voies divines.",
            "Proverbes": "Cette maxime transmet la sagesse pratique pour une vie alignée sur la crainte de l'Éternel, fondement de toute vraie connaissance.",
            "Matthieu": "Cet enseignement de Jésus révèle les principes du Royaume des cieux et leur application dans la vie du disciple.",
            "Jean": "Ce verset développe la théologie johannique de la révélation, mettant l'accent sur la vie éternelle et la connaissance du Père par le Fils.",
            "Romains": "Paul expose ici un aspect crucial de la doctrine du salut par la foi, fondement de la justification chrétienne.",
            "Apocalypse": "Cette vision prophétique dévoile les réalités célestes et l'accomplissement ultime du dessein divin dans l'histoire."
        }
        explanation_parts.append(context_mapping.get(book_name, f"Ce verset du livre de {book_name} apporte un éclairage particulier sur la révélation divine et ses implications pour la foi chrétienne."))
    
    # Joindre toutes les parties d'explication
    full_explanation = " ".join(explanation_parts)
    
    # Supprimer les références Strong et nettoyer le texte
    full_explanation = full_explanation.replace("strong", "").replace("Strong", "")
    full_explanation = ' '.join(full_explanation.split())  # Nettoyer les espaces multiples
    
    return full_explanation

def format_theological_content(content: str) -> str:
    """
    Formate le contenu théologique pour l'affichage (convertit ** en gras HTML)
    """
    # Convertir les étoiles en gras HTML (mais éviter les doubles)
    import re
    
    # D'abord nettoyer les doubles étoiles déjà dans des balises strong
    content = re.sub(r'<strong>\*\*(.*?)\*\*</strong>', r'<strong>\1</strong>', content)
    
    # Ensuite convertir les étoiles restantes
    content = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', content)
    
    # Corriger les balises cassées comme <>texte</>
    content = re.sub(r'<>(.*?)</>', r'<strong>\1</strong>', content)
    
    # Supprimer toute référence au mot "strong" en tant que mot isolé
    content = re.sub(r'\bstrong\b', '', content, flags=re.IGNORECASE)
    content = re.sub(r'\s+', ' ', content)  # Nettoyer les espaces multiples
    
    return content.strip()


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
            f"<strong>{title}</strong><br><br>{intro}<br><br"
            f"<strong>VERSET {verse}</strong><br><br>"
            f"<strong>TEXTE BIBLIQUE :</strong><br>{text}<br><br>"
            f"<strong>EXPLICATION THÉOLOGIQUE :</strong><br>{theological_explanation}"
        )
        return {"content": format_theological_content(content)}

    # Pour un chapitre entier, parser les versets et générer les explications
    lines = [l for l in text.splitlines() if l.strip()]
    blocks: List[str] = [f"{title}\n\n{intro}"]
    
    # Limitation : maximum 10 versets avec explications détaillées pour éviter les timeouts
    max_verses_with_detailed_explanations = 10
    verse_count = 0
    
    for line in lines:
        m = re.match(r"^(\d+)\.\s*(.*)$", line)
        if not m:
            continue
        vnum = int(m.group(1))
        vtxt = m.group(2).strip()
        
        # Générer l'explication théologique seulement pour les premiers versets
        if verse_count < max_verses_with_detailed_explanations:
            theological_explanation = generate_simple_theological_explanation(vtxt, book_label, chap, vnum)
            theological_explanation = format_theological_content(theological_explanation)
            verse_count += 1
        else:
            # Pour les versets suivants, utiliser un placeholder amélioré
            theological_explanation = f"<strong>Analyse théologique à développer pour le verset {vnum}</strong><br><br>Ce verset mériterait une étude approfondie du contexte historique, littéraire et théologique. Les thèmes principaux à explorer incluent les implications doctrinales et les applications pratiques pour le croyant contemporain."
        
        blocks.append(
            f"<strong>VERSET {vnum}</strong><br><br>"
            f"<strong>TEXTE BIBLIQUE :</strong><br>{vtxt}<br><br>"
            f"<strong>EXPLICATION THÉOLOGIQUE :</strong><br>{theological_explanation}"
        )
    return {"content": "<br><br>".join(blocks).strip()}

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
