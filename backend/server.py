from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
from typing import List, Optional
import json
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

def get_bible_text(book: str, chapter: int) -> Optional[str]:
    """Récupère le texte biblique via l'API Bible Derby"""
    try:
        headers = {
            "api-key": BIBLE_API_KEY,
            "accept": "application/json"
        }
        
        # Mapping des noms français vers les codes API
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
    """Génère une étude biblique avec contenu théologique unique"""
    try:
        # Parser le passage (ex: "Jean 3:16 LSG")
        parts = request.passage.split()
        book = parts[0]
        chapter_verse = parts[1].split(":")
        chapter = int(chapter_verse[0])
        
        # Récupérer le texte biblique via API Bible Derby
        bible_text = get_bible_text(book, chapter)
        
        # Récupérer le contenu théologique unique depuis notre bibliothèque
        theological_content = get_theological_content(book, chapter)
        
        # Construire la réponse formatée selon les standards théologiques
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

Cette étude de **{book} {chapter}** nous conduit dans les profondeurs de la **révélation divine**. Les vérités exposées s'enracinent dans l'**exégèse rigoureuse** et l'**herméneutique orthodoxe**, nous orientant vers une **foi éclairée** et une **piété transformatrice**.

Que l'**Esprit Saint** nous guide dans toute la vérité alors que nous méditons ces **saintes Écritures**, **inspirées de Dieu** et utiles pour l'enseignement, la conviction, la correction et l'instruction dans la justice.

## 📚 Références Canoniques

*Cette étude respecte l'**analogie de la foi** et s'harmonise avec l'ensemble du **canon scripturaire**.*

---
**Soli Deo Gloria** - *Étude conforme à la saine doctrine des Saintes Écritures*"""

        return {"content": content}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la génération: {str(e)}")

@app.post("/api/generate-verse-by-verse")
async def generate_verse_by_verse(request: VerseByVerseRequest):
    """Génère une étude verset par verset complète d'un chapitre"""
    try:
        # Parser le passage (ex: "Jean 3:16 LSG")
        parts = request.passage.split()
        book = parts[0]
        chapter_verse = parts[1].split(":")
        chapter = int(chapter_verse[0])
        
        # Récupérer tous les versets avec leurs explications
        verses_content = get_all_verses_for_chapter(book, chapter)
        
        if not verses_content:
            # Contenu de fallback si pas de contenu spécifique
            bible_text = get_bible_text(book, chapter)
            return {
                "content": f"""# 📖 Étude Verset par Verset - {book} {chapter}

## Texte Biblique Complet - Bible Derby
{bible_text or 'Texte biblique disponible via API Bible Derby...'}

## 🔍 Analyse Verset par Verset

*Cette fonctionnalité d'étude verset par verset est en cours de développement pour {book} {chapter}. Le contenu théologique complet sera bientôt disponible.*

**En attendant, voici le texte biblique complet pour votre méditation personnelle.**

---
**Note** : L'étude verset par verset détaillée sera progressivement ajoutée pour tous les 66 livres bibliques."""
            }
        
        # Construire l'étude verset par verset
        content = f"""# 📖 Étude Verset par Verset - {book} Chapitre {chapter}

## 🎯 Introduction au Chapitre

Cette étude examine chaque verset de **{book} {chapter}** selon les principes de l'**exégèse grammatico-historique** et de l'**herméneutique orthodoxe**. Chaque verset révèle les richesses de la **révélation divine** dans son contexte canonique.

---

"""
        
        # Ajouter chaque verset avec son explication
        for i, verse_data in enumerate(verses_content, 1):
            content += f"""## 📝 Verset {verse_data['verse_number']}

### **Texte Biblique :**
*"{verse_data['verse_text']}"*

### **💡 Explication Théologique :**

{verse_data['explanation']}

---

"""
        
        content += f"""## 🙏 Synthèse Spirituelle

Cette étude verset par verset de **{book} {chapter}** révèle la cohérence parfaite de la **Parole de Dieu**. Chaque verset s'harmonise dans l'**analogie de la foi** et contribue à l'édification spirituelle des croyants.

Que l'**Esprit Saint** illumine notre compréhension et transforme nos cœurs par la méditation de ces **saintes Écritures**.

## 📚 Principe Herméneutique

*Cette étude respecte l'**inspiration plénière** des Écritures et leur **autorité absolue** en matière de foi et de conduite.*

---
**Soli Deo Gloria** - *Étude conforme à la saine doctrine réformée*"""

        return {"content": content}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la génération verset par verset: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)