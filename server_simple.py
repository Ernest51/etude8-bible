from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import os
from dotenv import load_dotenv
import google.generativeai as genai

# Charger les variables d'environnement
load_dotenv()

# Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    print("✅ Gemini configured with personal key (GRATUIT)")
    GEMINI_AVAILABLE = True
else:
    print("❌ No personal Gemini key available")
    GEMINI_AVAILABLE = False

app = FastAPI(title="Bible Study API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modèles
class VerseByVerseRequest(BaseModel):
    passage: str = Field(..., description="Ex: 'Genèse 1' ou 'Genèse 1:1'")
    version: str = Field("LSG", description="Version biblique")
    tokens: int = Field(500, description="Longueur cible")
    use_gemini: bool = Field(True, description="Utiliser Gemini")
    enriched: bool = Field(True, description="Contenu enrichi")

# Fonction Gemini
async def generate_with_gemini(prompt: str) -> str:
    if not GEMINI_AVAILABLE:
        return "Gemini non disponible"
    
    try:
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        response = model.generate_content(prompt)
        
        if response and response.text:
            print(f"✅ Content generated with personal Gemini (GRATUIT): {len(response.text)} chars")
            return response.text.strip()
        else:
            return "Pas de réponse de Gemini"
    except Exception as e:
        print(f"❌ Erreur Gemini: {e}")
        return f"Erreur Gemini: {str(e)}"

# Routes
@app.get("/")
async def root():
    return {"message": "Bible Study API avec clé Gemini personnelle GRATUITE"}

@app.get("/api/health")
async def health():
    return {
        "status": "ok", 
        "gemini_enabled": GEMINI_AVAILABLE,
        "message": "Personal Gemini key configured" if GEMINI_AVAILABLE else "No Gemini key"
    }

@app.post("/api/generate-verse-by-verse")
async def generate_verse_by_verse(request: VerseByVerseRequest):
    try:
        # Prompt pour verset par verset
        prompt = f"""
Génère une étude biblique verset par verset pour {request.passage} en français.

Pour CHAQUE verset, fournis cette structure :
VERSET [numéro] 📖
TEXTE BIBLIQUE 📜 : [texte exact du verset français]
EXPLICATION THÉOLOGIQUE 🎓 : [analyse théologique de 100-200 mots]

Longueur cible totale : {request.tokens} mots environ.
Utilise un français théologique précis et accessible.
"""
        
        # Générer avec votre Gemini gratuit
        content = await generate_with_gemini(prompt)
        
        return {
            "content": content,
            "passage": request.passage,
            "version": request.version,
            "tokens": len(content),
            "gemini_used": GEMINI_AVAILABLE
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur génération: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
