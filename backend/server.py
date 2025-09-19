from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
from typing import List, Optional, Dict, Any
import re

from theological_content import get_theological_content
from verse_by_verse_content import get_all_verses_for_chapter

app = FastAPI()

# ---------- CORS ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # en prod: restreindre si besoin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Config API Bible ----------
BIBLE_API_KEY = "0cff5d83f6852c3044a180cc4cdeb0fe"
BIBLE_API_BASE = "https://api.scripture.api.bible/v1"
BIBLE_ID = "de4e12af7f28f599-02"  # Bible Derby (FR)

# ---------- Modèles ----------
class StudyRequest(BaseModel):
    passage: str
    version: str
    tokens: Optional[int] = 500
    model: Optional[str] = "gpt"
    requestedRubriques: Optional[List[int]] = None

class VerseByVerseRequest(BaseModel):
    passage: str
    version: str

class Generate28Request(BaseModel):
    passage: str
    version: str

# ---------- Utils ----------
BOOK_CODE_MAP = {
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

def parse_passage(passage: str, default_version: str = "LSG") -> Dict[str, Any]:
    """
    Supporte: 'Jean 3:16 LSG', 'Jean 3 LSG', '1 Samuel 17 LSG', 'Nombres 2 LSG'
    Retourne dict: {'book': <str>, 'chapter': <int>, 'verse': Optional[int], 'version': <str>}
    """
    txt = passage.strip()
    tokens = txt.split()

    # Cherche le premier token de type chapitre/verset (ex: 3, 3:16, 3:1-5)
    chap_token_idx = None
    for idx, tok in enumerate(tokens):
        if re.match(r"^\d+(:\d+(-\d+)?)?$", tok):
            chap_token_idx = idx
            break

    version = default_version
    # Le dernier token est parfois la version
    if len(tokens) >= 2 and re.match(r"^[A-Z0-9\-]{2,8}$", tokens[-1]):
        version = tokens[-1]

    if chap_token_idx is not None:
        book = " ".join(tokens[:chap_token_idx]).strip()
        chap_tok = tokens[chap_token_idx]
        # extraire chapitre et (optionnellement) verset
        if ":" in chap_tok:
            ch, v = chap_tok.split(":", 1)
            chapter = int(ch)
            try:
                verse = int(v.split("-")[0])
            except:
                verse = None
        else:
            chapter = int(chap_tok)
            verse = None
    else:
        # fallback: pas de chapitre trouvé -> chapitre 1
        book = " ".join(tokens[:-1]).strip() if len(tokens) > 1 else tokens[0]
        chapter = 1
        verse = None

    return {"book": book, "chapter": chapter, "verse": verse, "version": version}

def get_bible_text(book: str, chapter: int) -> Optional[str]:
    """Récupère le contenu HTML du chapitre via l'API Scripture."""
    try:
        headers = {"api-key": BIBLE_API_KEY, "accept": "application/json"}
        code = BOOK_CODE_MAP.get(book)
        if not code:
            return None
        url = f"{BIBLE_API_BASE}/bibles/{BIBLE_ID}/chapters/{code}.{chapter}"
        r = requests.get(url, headers=headers, timeout=15)
        if r.status_code == 200:
            data = r.json()
            return data.get("data", {}).get("content", "")
        return None
    except Exception as e:
        print(f"[API Bible] Erreur: {e}")
        return None

# ---------- Routes de base ----------
@app.get("/api/")
async def root():
    return {"message": "Bible Study API - Bible Derby"}

@app.get("/api/health")
async def health():
    return {"ok": True}

# ---------- Étude classique (déjà présente) ----------
@app.post("/api/generate-study")
async def generate_study(request: StudyRequest):
    try:
        meta = parse_passage(request.passage, request.version)
        book, chapter = meta["book"], meta["chapter"]

        bible_text = get_bible_text(book, chapter)
        theo = get_theological_content(book, chapter)

        content = f"""# {theo.get('title','Étude biblique')}

## 📖 Texte Biblique - Bible Derby
{bible_text or 'Texte biblique en cours de chargement via API Bible Derby...'}

## 🎯 Analyse Narrative et Théologique

{theo.get('narrative','')}

## ✨ Points Doctrinaux Essentiels
"""
        for point in theo.get("theological_points", []):
            content += f"• {point}\n"

        content += f"""

## 🙏 Méditation Spirituelle

Cette étude de **{book} {chapter}** nous conduit dans les profondeurs de la **révélation divine**.

## 📚 Références Canoniques

*Étude conforme à l'analogie de la foi.*

---
**Soli Deo Gloria**
"""
        return {"content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la génération: {str(e)}")

# ---------- Verset par verset (déjà présent) ----------
@app.post("/api/generate-verse-by-verse")
async def generate_verse_by_verse(request: VerseByVerseRequest):
    try:
        meta = parse_passage(request.passage, request.version)
        book, chapter = meta["book"], meta["chapter"]

        verses_content = get_all_verses_for_chapter(book, chapter)

        if not verses_content:
            bible_text = get_bible_text(book, chapter)
            return {
                "content": f"""Étude Verset par Verset - {book} Chapitre {chapter}

# 📖 

## Texte Biblique Complet - Bible Derby
{bible_text or 'Texte biblique disponible via API Bible Derby...'}

## 🔍 Analyse Verset par Verset
*Contenu détaillé en cours d’enrichissement pour {book} {chapter}.*
"""
            }

        content = f"""Étude Verset par Verset - {book} Chapitre {chapter}

Introduction au Chapitre

Cette étude examine chaque verset de {book} {chapter} selon une exégèse grammatico-historique.

"""
        for v in verses_content:
            content += f"""VERSET {v['verse_number']}

TEXTE BIBLIQUE :
{v['verse_text']}

EXPLICATION THÉOLOGIQUE :

{v['explanation']}

"""
        content += "Soli Deo Gloria"
        return {"content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la génération verset par verset: {str(e)}")

# ---------- NOUVEAU : Étude complète en 28 rubriques ----------
@app.post("/api/generate-28")
async def generate_28(request: Generate28Request):
    """
    Produit un document '28 rubriques' pour le livre+chapitre éventuellement sans verset.
    """
    try:
        meta = parse_passage(request.passage, request.version)
        book, chapter = meta["book"], meta["chapter"]
        version = meta["version"]

        bible_text_html = get_bible_text(book, chapter)
        theo = get_theological_content(book, chapter)  # peut retourner des points utiles

        # Utilitaires contenus
        theo_points = theo.get("theological_points", []) if isinstance(theo, dict) else []
        narrative = theo.get("narrative", "") if isinstance(theo, dict) else ""
        title = theo.get("title", f"Étude de {book} {chapter}")

        # Corps
        lines = []
        lines.append(f"**Étude complète en 28 rubriques — {book} {chapter} ({version})**")
        lines.append("")
        lines.append("**📖 Texte biblique (chapitre complet – Bible Derby)**")
        lines.append(bible_text_html or "Texte biblique disponible via API Bible Derby...")
        lines.append("")

        # 1. Étude verset par verset = renvoi synthétique
        lines.append("**1. Étude verset par verset (aperçu)**")
        lines.append("Pour le détail, utilisez le bouton 📖 Versets. Ci-dessous : synthèse des mouvements principaux du chapitre.")
        if narrative:
            lines.append(narrative)
        lines.append("")

        # 2. Prière d'ouverture
        lines.append("**2. Prière d'ouverture**")
        lines.append("Seigneur, ouvre nos cœurs et notre intelligence afin de recevoir ta Parole avec foi, humilité et obéissance. Amen.")
        lines.append("")

        # 3. Structure littéraire
        lines.append("**3. Structure littéraire**")
        lines.append(f"{book} {chapter} se découpe en unités cohérentes (introduction, développement, conclusion). Identifiez les refrains, répétitions, parallélismes ou inclusios.")
        lines.append("")

        # 4. Questions du chapitre précédent
        lines.append("**4. Questions du chapitre précédent**")
        lines.append("Quels fils narratifs/argumentatifs mènent à ce chapitre ? Quelles tensions étaient ouvertes et reçoivent ici une réponse ?")
        lines.append("")

        # 5. Thème doctrinal
        lines.append("**5. Thème doctrinal**")
        if theo_points:
            lines.append(" • " + "\n • ".join(theo_points[:4]))
        else:
            lines.append(" • Souveraineté de Dieu\n • Révélation et Alliance\n • Sainteté / justice de Dieu\n • Grâce et foi")
        lines.append("")

        # 6. Fondements théologiques
        lines.append("**6. Fondements théologiques**")
        lines.append("Principes : inspiration, inerrance, analogie de la foi, centralité du Christ, unité canonique.")
        lines.append("")

        # 7-9. Contextes
        lines.append("**7. Contexte historique**")
        lines.append("Situer date, auteurs, destinataires, événements majeurs environnants.")
        lines.append("")
        lines.append("**8. Contexte culturel**")
        lines.append("Usages, institutions, vie quotidienne ; éviter les anachronismes.")
        lines.append("")
        lines.append("**9. Contexte géographique**")
        lines.append("Repères de lieux, itinéraires, reliefs ; impact sur la compréhension du texte.")
        lines.append("")

        # 10. Analyse lexicale
        lines.append("**10. Analyse lexicale**")
        lines.append("Termes-clés (hébreu/grec) et champ sémantique ; mots répétés et leur portée.")
        lines.append("")

        # 11. Parallèles bibliques
        lines.append("**11. Parallèles bibliques**")
        lines.append("Comparer avec passages connexes dans la Loi, les Prophètes, les Évangiles et les Épîtres.")
        lines.append("")

        # 12. Prophétie et accomplissement
        lines.append("**12. Prophétie et accomplissement**")
        lines.append("Identifier promesses/typologies et leur accomplissement en Christ et dans l’Église.")
        lines.append("")

        # 13. Personnages
        lines.append("**13. Personnages**")
        lines.append("Qui agit ? Motivations, faiblesses, vertus, rôle dans l’économie du salut.")
        lines.append("")

        # 14. Structure rhétorique
        lines.append("**14. Structure rhétorique**")
        lines.append("Logique interne, arguments, connecteurs, chiasmes, crescendos, contrastes.")
        lines.append("")

        # 15. Théologie trinitaire
        lines.append("**15. Théologie trinitaire**")
        lines.append("Repérer l’œuvre du Père, du Fils et de l’Esprit ; leurs missions et l’unité de leur action.")
        lines.append("")

        # 16. Christ au centre
        lines.append("**16. Christ au centre**")
        lines.append("Lire Christocentriquement : types, ombres, accomplissements, seigneurie du Christ.")
        lines.append("")

        # 17-18. Applications
        lines.append("**17. Évangile et grâce**")
        lines.append("Comment l’Évangile est-il déployé ici ? Grâce offerte, repentance et foi.")
        lines.append("")
        lines.append("**18. Application personnelle**")
        lines.append("Exemples concrets : disciplines spirituelles, caractères à cultiver, péchés à abandonner.")
        lines.append("")
        lines.append("**19. Application communautaire**")
        lines.append("Église / famille / société : adoration, service, justice, compassion, mission.")
        lines.append("")

        # 20. Prière de réponse
        lines.append("**20. Prière de réponse**")
        lines.append("Seigneur, grave ta Parole dans nos vies ; rends-nous praticiens de ta vérité. Amen.")
        lines.append("")

        # 21. Questions d’étude
        lines.append("**21. Questions d’étude**")
        lines.append("1) Quel est l’axe principal du chapitre ? 2) Qu’apprend-on sur Dieu ? 3) Quelles implications pour aujourd’hui ?")
        lines.append("")

        # 22. Points de vigilance
        lines.append("**22. Points de vigilance**")
        lines.append("Éviter les surinterprétations ; respecter le contexte ; ne pas isoler des versets.")
        lines.append("")

        # 23. Objections et réponses
        lines.append("**23. Objections et réponses**")
        lines.append("Formuler les objections possibles et y répondre bibliquement et charitablement.")
        lines.append("")

        # 24. Perspective missionnelle
        lines.append("**24. Perspective missionnelle**")
        lines.append("Comment ce chapitre motive-t-il l’annonce de l’Évangile aux nations ?")
        lines.append("")

        # 25. Éthique chrétienne
        lines.append("**25. Éthique chrétienne**")
        lines.append("Repères pour la sainteté, la justice, la dignité humaine, la création, l’économie, etc.")
        lines.append("")

        # 26. Louange / liturgie
        lines.append("**26. Louange / liturgie**")
        lines.append("Chants, prières, liturgie possibles en écho aux thèmes du chapitre.")
        lines.append("")

        # 27. Méditation guidée / versets clés
        lines.append("**27. Méditation guidée / versets clés**")
        lines.append("Choisir 2–3 versets à mémoriser et méditer dans la semaine.")
        lines.append("")

        # 28. Plan d’action
        lines.append("**28. Plan d’action**")
        lines.append("Objectifs précis pour mettre en pratique ; une chose à prier, une à changer, une à partager.")
        lines.append("")
        lines.append("Soli Deo Gloria")

        # Le front met en forme les lignes et le gras (**...**)
        content = "\n".join(lines)
        return {"content": content}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur génération 28 rubriques: {str(e)}")

# ---------- Main ----------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
