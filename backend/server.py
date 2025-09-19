# server.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Tuple, Dict
import requests, re, html as ihtml

# --- modules internes (inchangés) ---
from theological_content import get_theological_content
from verse_by_verse_content import get_all_verses_for_chapter

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Scripture API Bible
BIBLE_API_KEY = "0cff5d83f6852c3044a180cc4cdeb0fe"
BIBLE_API_BASE = "https://api.scripture.api.bible/v1"
BIBLE_ID = "de4e12af7f28f599-02"  # Bible Derby FR (LSG)

# Mapping FR -> codes API
BOOK_CODES: Dict[str, str] = {
    "Genèse": "GEN", "Exode": "EXO", "Lévitique": "LEV", "Nombres": "NUM", "Deutéronome": "DEU",
    "Josué": "JOS", "Juges": "JDG", "Ruth": "RUT", "1 Samuel": "1SA", "2 Samuel": "2SA",
    "1 Rois": "1KI", "2 Rois": "2KI", "1 Chroniques": "1CH", "2 Chroniques": "2CH",
    "Esdras": "EZR", "Néhémie": "NEH", "Esther": "EST", "Job": "JOB", "Psaumes": "PSA",
    "Proverbes": "PRO", "Ecclésiaste": "ECC", "Cantique": "SNG", "Ésaïe": "ISA",
    "Jérémie": "JER", "Lamentations": "LAM", "Ézéchiel": "EZK", "Daniel": "DAN",
    "Osée": "HOS", "Joël": "JOL", "Amos": "AMO", "Abdias": "OBA", "Jonas": "JON",
    "Michée": "MIC", "Nahum": "NAM", "Habacuc": "HAB", "Sophonie": "ZEP",
    "Aggée": "HAG", "Zacharie": "ZEC", "Malachie": "MAL", "Matthieu": "MAT",
    "Marc": "MRK", "Luc": "LUK", "Jean": "JHN", "Actes": "ACT", "Romains": "ROM",
    "1 Corinthiens": "1CO", "2 Corinthiens": "2CO", "Galates": "GAL", "Éphésiens": "EPH",
    "Philippiens": "PHP", "Colossiens": "COL", "1 Thessaloniciens": "1TH",
    "2 Thessaloniciens": "2TH", "1 Timothée": "1TI", "2 Timothée": "2TI",
    "Tite": "TIT", "Philémon": "PHM", "Hébreux": "HEB", "Jacques": "JAS",
    "1 Pierre": "1PE", "2 Pierre": "2PE", "1 Jean": "1JN", "2 Jean": "2JN",
    "3 Jean": "3JN", "Jude": "JUD", "Apocalypse": "REV"
}

# --------- Modèles ---------
class StudyRequest(BaseModel):
    passage: str
    version: str
    tokens: int
    model: str
    requestedRubriques: List[int]

class VerseByVerseRequest(BaseModel):
    passage: str
    version: str

class Generate28Request(BaseModel):
    passage: str
    version: str

# --------- Utils parsing ---------
PASSAGE_RE = re.compile(r"^(?P<book>.+?)\s+(?P<chapter>\d+)(?::(?P<verse>\d+))?\b", re.IGNORECASE)

def parse_passage(passage: str) -> Tuple[str, int, Optional[int]]:
    """
    Accepte 'Jean 3:16 LSG' ou 'Nombres 2 LSG' etc.
    Renvoie (book, chapter, verse|None)
    """
    m = PASSAGE_RE.search(passage.strip())
    if not m:
        raise ValueError(f"Passage invalide: {passage}")
    book = m.group("book").strip()
    chapter = int(m.group("chapter"))
    verse = int(m.group("verse")) if m.group("verse") else None
    return book, chapter, verse

def get_headers() -> Dict[str, str]:
    return {"api-key": BIBLE_API_KEY, "accept": "application/json"}

def fetch_chapter_content(book: str, chapter: int, content_type: str = "html") -> Optional[str]:
    """
    Récupère le contenu du chapitre au format HTML ou TEXT.
    """
    code = BOOK_CODES.get(book)
    if not code:
        return None
    url = f"{BIBLE_API_BASE}/bibles/{BIBLE_ID}/chapters/{code}.{chapter}"
    params = {
        "contentType": content_type,  # "html" | "text"
        "includeChapterNumbers": "false",
        "includeVerseNumbers": "true",
        "includeVerseSpans": "true",
    }
    try:
        r = requests.get(url, headers=get_headers(), params=params, timeout=15)
        if r.status_code == 200:
            data = r.json()
            return data.get("data", {}).get("content", "")
        return None
    except Exception:
        return None

def html_to_text(html_content: str) -> str:
    """
    Convertit l'HTML de Scripture API en texte brut en insérant un saut de ligne avant les numéros de verset.
    """
    if not html_content:
        return ""
    s = html_content

    # Verses numbers like <sup class="v">1</sup> -> "\n1 "
    s = re.sub(r"<\s*sup[^>]*>\s*(\d{1,3})\s*<\s*/\s*sup\s*>", r"\n\1 ", s, flags=re.IGNORECASE)

    # Retirer le reste des balises
    s = re.sub(r"<[^>]+>", "", s)

    # Décoder entités HTML
    s = ihtml.unescape(s)

    # Normaliser espaces
    s = re.sub(r"\r?\n\s*\n+", "\n", s)
    s = re.sub(r"[ \t]+", " ", s)
    s = s.strip()
    return s

def split_verses_from_text(text: str) -> List[Tuple[int, str]]:
    """
    Extrait (numéro, texte) pour chaque verset.
    On s'appuie sur le fait que html_to_text a inséré '\nN ' avant chaque verset.
    """
    if not text:
        return []
    verses = []
    # chaque ligne qui commence par un numéro de verset
    for m in re.finditer(r"^\s*(\d{1,3})\s+([^\n]+(?:\n(?!\s*\d+\s).+)*)", text, flags=re.MULTILINE):
        num = int(m.group(1))
        vtext = m.group(2).strip()
        verses.append((num, vtext))
    # si rien n'a été capturé, tenter une séparation plus naïve (rare)
    if not verses:
        chunks = re.split(r"\n(?=\d{1,3}\s)", text)
        for c in chunks:
            m = re.match(r"^\s*(\d{1,3})\s+(.*)$", c.strip(), flags=re.DOTALL)
            if m:
                verses.append((int(m.group(1)), m.group(2).strip()))
    return verses

def get_bible_text(book: str, chapter: int) -> Optional[str]:
    """
    (Compat) récupère le contenu brut (HTML -> texte) pour un chapitre.
    """
    html = fetch_chapter_content(book, chapter, content_type="html") or \
           fetch_chapter_content(book, chapter, content_type="text")
    if not html:
        return None
    # quand contentType=text, l'API renvoie déjà du texte, mais on passe quand même par le même pipeline
    if "<" in html or "</" in html:
        return html_to_text(html)
    return html.strip()

# --------- Routes simples ---------
@app.get("/api/")
async def root():
    return {"message": "Bible Study API - Bible Derby (LSG) - OK"}

@app.get("/api/health")
async def health():
    return {"ok": True}

# --------- Endpoints existants (compat) ---------
@app.post("/api/generate-study")
async def generate_study(request: StudyRequest):
    """
    Étude 'synthétique' (endpoint existant). On le laisse pour compatibilité,
    mais on recommande désormais /api/generate-28 pour la version en 28 rubriques.
    """
    try:
        book, chapter, _ = parse_passage(request.passage)
        bible_text = get_bible_text(book, chapter) or "Texte biblique en cours de chargement via API Bible Derby..."
        theological_content = get_theological_content(book, chapter)

        content = f"""# {theological_content['title']}

## 📖 Texte Biblique - Bible Derby
{bible_text}

## 🎯 Analyse Narrative et Théologique

{theological_content['narrative']}

## ✨ Points Doctrinaux Essentiels
"""
        for point in theological_content.get('theological_points', []):
            content += f"• {point}\n"

        content += f"""

## 🙏 Méditation Spirituelle

Cette étude de **{book} {chapter}** nous conduit dans les profondeurs de la **révélation divine**. Les vérités exposées s'enracinent dans l'**exégèse rigoureuse** et l'**herméneutique orthodoxe**, nous orientant vers une **foi éclairée** et une **piété transformatrice**.

## 📚 Références Canoniques

*Cette étude respecte l'**analogie de la foi** et s'harmonise avec l'ensemble du **canon scripturaire**.*

---
**Soli Deo Gloria**"""
        return {"content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la génération: {str(e)}")

# --------- Verset par verset (amélioré) ---------
@app.post("/api/generate-verse-by-verse")
async def generate_verse_by_verse(request: VerseByVerseRequest):
    """
    Étude verset par verset : 
    1) on tente la librairie interne (contenu sur-mesure),
    2) sinon on récupère tout le chapitre via Scripture API et on split versets.
    """
    try:
        book, chapter, _ = parse_passage(request.passage)

        # 1) Contenu interne sur-mesure
        verses_content = get_all_verses_for_chapter(book, chapter)

        if verses_content:
            # Construire avec le format attendu par le front
            content = f"""Étude Verset par Verset - {book} Chapitre {chapter}

Introduction au Chapitre

Cette étude examine chaque verset de {book} {chapter} selon les principes de l'exégèse grammatico-historique et de l'herméneutique orthodoxe. Chaque verset révèle les richesses de la révélation divine dans son contexte canonique.

"""
            for vd in verses_content:
                content += f"""VERSET {vd['verse_number']}

TEXTE BIBLIQUE :
{vd['verse_text']}

EXPLICATION THÉOLOGIQUE :

{vd['explanation']}

"""
            content += """Synthèse Spirituelle

Que l'Esprit Saint illumine notre compréhension et transforme nos cœurs par la méditation de ces saintes Écritures.

Principe Herméneutique

Cette étude respecte l'inspiration plénière des Écritures et leur autorité absolue en matière de foi et de conduite.

Soli Deo Gloria - Étude conforme à la saine doctrine"""
            return {"content": content}

        # 2) Fallback automatique : récupérer le texte par verset via Scripture API
        raw = fetch_chapter_content(book, chapter, content_type="html") or \
              fetch_chapter_content(book, chapter, content_type="text")
        if not raw:
            # Dernier recours : message court
            return {"content": f"""# 📖 Étude Verset par Verset - {book} {chapter}

**Texte indisponible pour le moment (API). Réessayez plus tard.**"""}

        flat = html_to_text(raw)
        verses = split_verses_from_text(flat)

        if not verses:
            # Si on n'a pas pu découper, afficher tout le texte
            return {"content": f"""# 📖 Étude Verset par Verset - {book} {chapter}

## Texte Biblique Complet - Bible Derby
{flat}

## 🔍 Analyse Verset par Verset
*Découpage automatique indisponible — affichage du chapitre complet.*"""}

        # Construire la réponse formatée
        content = f"""Étude Verset par Verset - {book} Chapitre {chapter}

Introduction au Chapitre

Cette étude examine chaque verset de {book} {chapter} selon une exégèse grammatico-historique.

"""
        for num, vtext in verses:
            content += f"""VERSET {num}

TEXTE BIBLIQUE :
{vtext}

EXPLICATION THÉOLOGIQUE :

— Observation : relevez le sens littéral du verset.
— Doctrine : quelles vérités divines sont affirmées ?
— Application : quelle réponse de foi/pratique aujourd’hui ?

"""
        content += "Soli Deo Gloria"
        return {"content": content}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la génération verset par verset: {str(e)}")

# --------- Étude complète en 28 rubriques ---------
RUBRIQUES_28 = [
  "Étude verset par verset","Prière d'ouverture","Structure littéraire",
  "Questions du chapitre précédent","Thème doctrinal","Fondements théologiques",
  "Contexte historique","Contexte culturel","Contexte géographique",
  "Analyse lexicale","Parallèles bibliques","Prophétie et accomplissement",
  "Personnages","Structure rhétorique","Théologie trinitaire","Christ au centre",
  "Évangile et grâce","Application personnelle","Application communautaire",
  "Prière de réponse","Questions d'étude","Points de vigilance",
  "Objections et réponses","Perspective missionnelle","Éthique chrétienne",
  "Louange / liturgie","Méditation guidée","Mémoire / versets clés","Plan d'action"
]

@app.post("/api/generate-28")
async def generate_28(request: Generate28Request):
    """
    Rend une étude structurée en 28 rubriques (texte formaté lisible).
    """
    try:
        book, chapter, verse = parse_passage(request.passage)
        theo = get_theological_content(book, chapter)

        # Points doctrinaux depuis la lib (si présents)
        pts = theo.get("theological_points", []) or []

        def h(idx: int, title: str) -> str:
            return f"\n**{idx}. {title}**\n"

        content = f"""# Étude complète — {book} {chapter}{(':'+str(verse)) if verse else ''}

**Titre :** {theo.get('title','Étude biblique')}
        
**Résumé narratif :**
{theo.get('narrative','')}

"""

        for i, title in enumerate(RUBRIQUES_28, start=1):
            content += h(i, title)
            if title == "Étude verset par verset":
                content += "Utilisez le bouton **📖 Versets** pour la lecture détaillée verset par verset.\n"
            elif title == "Thème doctrinal":
                content += (pts[0] if pts else "Synthèse doctrinale du passage (sainteté de Dieu, alliance, grâce, foi, obéissance).") + "\n"
            elif title == "Fondements théologiques":
                if pts:
                    content += "".join(f"• {p}\n" for p in pts)
                else:
                    content += "• Autorité de l’Écriture\n• Souveraineté de Dieu\n• Centralité du Christ\n• Grâce et foi\n"
            elif title == "Parallèles bibliques":
                content += "• Relier le passage aux textes canoniques connexes (AT/NT) pour l’analogie de la foi.\n"
            elif title == "Théologie trinitaire":
                content += "• Repérer l’œuvre du Père, du Fils et du Saint-Esprit dans le passage.\n"
            elif title == "Christ au centre":
                content += "• Montrer comment le passage pointe vers l’œuvre et la personne de Christ.\n"
            elif title == "Évangile et grâce":
                content += "• Mettre en lumière la bonne nouvelle : initiative divine, grâce imméritée, appel à la foi.\n"
            elif title == "Application personnelle":
                content += "• 3 pistes concrètes (pensée, caractère, pratique).\n"
            elif title == "Application communautaire":
                content += "• 3 pistes pour l’Église (adoration, formation, mission).\n"
            elif title == "Méditation guidée":
                content += "• Prier avec le texte : adoration, confession, action de grâce, intercession.\n"
            elif title == "Mémoire / versets clés":
                content += "• Sélectionner 1–3 versets à mémoriser du chapitre.\n"
            elif title == "Plan d'action":
                content += "• 1 engagement pour cette semaine en lien avec le passage.\n"
            else:
                # gabarit générique court
                content += "• Points principaux à relever pour cette rubrique (synthèse brève et fidèle au texte).\n"

        content += "\n---\n**Soli Deo Gloria**"
        return {"content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur 28 rubriques: {str(e)}")

# --------- Lancement local ---------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
