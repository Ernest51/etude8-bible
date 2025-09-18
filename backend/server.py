from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
from typing import List, Optional
import re
from theological_content import get_theological_content
from verse_by_verse_content import get_all_verses_for_chapter

app = FastAPI()

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration API Bible Derby
BIBLE_API_KEY = "0cff5d83f6852c3044a180cc4cdeb0fe"
BIBLE_API_BASE = "https://api.scripture.api.bible/v1"
BIBLE_ID = "de4e12af7f28f599-02"  # Bible Derby en français

class StudyRequest(BaseModel):
    passage: str
    version: str
    tokens: int
    model: str
    requestedRubriques: List[int]

class VerseByVerseRequest(BaseModel):
    passage: str
    version: str

@app.get("/api/")
async def root():
    return {"message": "Bible Study API - Bible Derby"}

def parse_passage(passage: str):
    """
    Exemples :
    - 'Jean 3:16 LSG'      -> book='Jean', chapter=3
    - '1 Jean 2:1 LSG'     -> book='1 Jean', chapter=2
    - 'Psaumes 23 LSG'     -> book='Psaumes', chapter=23
    """
    match = re.match(r"(.+?)\s+(\d+)(?::\d+)?(?:\s+\w+)?$", passage.strip())
    if not match:
        raise ValueError(f"Format de passage invalide: {passage}")
    book = match.group(1).strip()
    chapter = int(match.group(2))
    return book, chapter

def get_bible_text(book: str, chapter: int) -> Optional[str]:
    """Récupère le texte biblique via l'API Bible Derby"""
    try:
        headers = {
            "api-key": BIBLE_API_KEY,
            "accept": "application/json"
        }
        book_mapping = {
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
        book_code = book_mapping.get(book, "GEN")
        url = f"{BIBLE_API_BASE}/bibles/{BIBLE_ID}/chapters/{book_code}.{chapter}"
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            return data.get("data", {}).get("content", "")
        return None
    except Exception as e:
        print(f"Erreur API Bible: {e}")
        return None

@app.post("/api/generate-study")
async def generate_study(request: StudyRequest):
    try:
        book, chapter = parse_passage(request.passage)
        bible_text = get_bible_text(book, chapter)
        theological_content = get_theological_content(book, chapter)
        content = f"""# {theological_content['title']}

## 📖 Texte Biblique - Bible Derby
{bible_text or 'Texte biblique en cours de chargement via API Bible Derby...'}

## 🎯 Analyse Narrative et Théologique

{theological_content['narrative']}

## ✨ Points Doctrinaux Essentiels

"""
        for point in theological_content.get('theological_points', []):
            content += f"• {point}\n"
        content += f"""

## 🙏 Méditation Spirituelle

Cette étude de **{book} {chapter}** nous conduit dans les profondeurs de la révélation divine.
"""
        return {"content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la génération: {str(e)}")

@app.post("/api/generate-verse-by-verse")
async def generate_verse_by_verse(request: VerseByVerseRequest):
    try:
        book, chapter = parse_passage(request.passage)
        verses_content = get_all_verses_for_chapter(book, chapter)
        if not verses_content:
            bible_text = get_bible_text(book, chapter)
            return {"content": f"Texte biblique complet:\n{bible_text}"}
        content = f"""Étude Verset par Verset - {book} Chapitre {chapter}\n\n"""
        for verse_data in verses_content:
            content += f"""VERSET {verse_data['verse_number']}\n\nTEXTE BIBLIQUE :\n{verse_data['verse_text']}\n\nEXPLICATION THÉOLOGIQUE :\n{verse_data['explanation']}\n\n"""
        return {"content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la génération verset par verset: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
