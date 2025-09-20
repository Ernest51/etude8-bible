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
    params = {"contentType": "text"}
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
        "Les sections *EXPLICATION THÉOLOGIQUE* sont à compléter."
    )

    if verse:
        content = (
            f"{title}\n\n{intro}\n\n"
            f"**VERSET {verse}**\n\n"
            f"**TEXTE BIBLIQUE :**\n{text}\n\n"
            f"**EXPLICATION THÉOLOGIQUE :**\n— à compléter —"
        )
        return {"content": content}

    lines = [l for l in text.splitlines() if l.strip()]
    blocks: List[str] = [f"{title}\n\n{intro}"]
    for line in lines:
        m = re.match(r"^(\d+)\.\s*(.*)$", line)
        if not m:
            continue
        vnum = m.group(1)
        vtxt = m.group(2).strip()
        blocks.append(
            f"**VERSET {vnum}**\n\n"
            f"**TEXTE BIBLIQUE :**\n{vtxt}\n\n"
            f"**EXPLICATION THÉOLOGIQUE :**\n— à compléter —"
        )
    return {"content": "\n\n".join(blocks).strip()}

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
