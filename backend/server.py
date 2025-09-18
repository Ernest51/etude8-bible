from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import asyncio
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Bible Books and Chapters mapping
BOOKS_CHAPTERS = {
    "Genèse": 50, "Exode": 40, "Lévitique": 27, "Nombres": 36, "Deutéronome": 34,
    "Josué": 24, "Juges": 21, "Ruth": 4, "1 Samuel": 31, "2 Samuel": 24,
    "1 Rois": 22, "2 Rois": 25, "1 Chroniques": 29, "2 Chroniques": 36,
    "Esdras": 10, "Néhémie": 13, "Esther": 10, "Job": 42, "Psaumes": 150,
    "Proverbes": 31, "Ecclésiaste": 12, "Cantique": 8, "Ésaïe": 66, "Jérémie": 52,
    "Lamentations": 5, "Ézéchiel": 48, "Daniel": 12, "Osée": 14, "Joël": 3,
    "Amos": 9, "Abdias": 1, "Jonas": 4, "Michée": 7, "Nahum": 3,
    "Habacuc": 3, "Sophonie": 3, "Aggée": 2, "Zacharie": 14, "Malachie": 4,
    "Matthieu": 28, "Marc": 16, "Luc": 24, "Jean": 21, "Actes": 28,
    "Romains": 16, "1 Corinthiens": 16, "2 Corinthiens": 13, "Galates": 6,
    "Éphésiens": 6, "Philippiens": 4, "Colossiens": 4, "1 Thessaloniciens": 5,
    "2 Thessaloniciens": 3, "1 Timothée": 6, "2 Timothée": 4, "Tite": 3,
    "Philémon": 1, "Hébreux": 13, "Jacques": 5, "1 Pierre": 5, "2 Pierre": 3,
    "1 Jean": 5, "2 Jean": 1, "3 Jean": 1, "Jude": 1, "Apocalypse": 22
}

# Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class StudyGenerationRequest(BaseModel):
    passage: str
    version: str = "LSG"
    tokens: int = 500
    model: str = "gpt"
    requestedRubriques: List[int] = []

class StudyGenerationResponse(BaseModel):
    content: str
    reference: str
    sections: Optional[List[Dict[str, str]]] = None

class BibleStudyResponse(BaseModel):
    ok: bool
    reference: str
    bibleId: str
    passage: Optional[Dict[str, Any]] = None
    sections: Optional[List[Dict[str, str]]] = None
    error: Optional[str] = None

class MeditationSave(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    reference: str
    passage_text: str
    meditation_content: str
    sections: List[Dict[str, str]]
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Initialize LLM Chat
def get_llm_chat():
    return LlmChat(
        api_key=os.environ.get('EMERGENT_LLM_KEY', 'sk-emergent-3BcF2643421D02fC0E'),
        session_id=f"bible_study_{uuid.uuid4()}",
        system_message="""Tu es un expert en méditation biblique et en étude des Écritures. 
        Tu aides les utilisateurs à comprendre et méditer sur les passages bibliques.
        Réponds toujours en français et fournis des méditations profondes et spirituelles."""
    ).with_model("openai", "gpt-4o-mini")

async def fetch_bible_passage(reference: str, version: str = "LSG"):
    """Fetch Bible passage from Bible API"""
    try:
        # Mock response for demonstration
        mock_passages = {
            "Jean 3:16": "Car Dieu a tant aimé le monde qu'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu'il ait la vie éternelle.",
            "Psaumes 23:1": "L'Éternel est mon berger: je ne manquerai de rien.",
            "Matthieu 5:3": "Heureux les pauvres en esprit, car le royaume des cieux est à eux!",
            "Romains 8:28": "Nous savons, du reste, que toutes choses concourent au bien de ceux qui aiment Dieu, de ceux qui sont appelés selon son dessein."
        }
        
        passage_text = mock_passages.get(reference, f"Passage biblique pour {reference} (version {version})")
        
        return {
            "text": passage_text,
            "reference": reference,
            "version": version
        }
    except Exception as e:
        logging.error(f"Error fetching Bible passage: {e}")
        return None

async def generate_meditation_study(passage_text: str, reference: str):
    """Generate meditation study using LLM"""
    try:
        chat = get_llm_chat()
        
        prompt = f"""
        Crée une méditation biblique approfondie sur ce passage:
        
        Référence: {reference}
        Texte: {passage_text}
        
        Structure ta réponse avec les sections suivantes:
        1. Contexte historique et littéraire
        2. Analyse théologique
        3. Application personnelle
        4. Questions de réflexion
        5. Prière de méditation
        
        Limite ta réponse à environ 500 mots maximum.
        """
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        sections = [
            {"title": "Contexte historique", "content": "Analyse du contexte biblique..."},
            {"title": "Théologie", "content": "Enseignements théologiques..."},
            {"title": "Application", "content": "Application pratique..."},
            {"title": "Réflexion", "content": "Questions pour méditer..."},
            {"title": "Prière", "content": "Prière de méditation..."}
        ]
        
        return {
            "meditation": response,
            "sections": sections
        }
    except Exception as e:
        logging.error(f"Error generating meditation: {e}")
        return {
            "meditation": "Erreur lors de la génération de la méditation.",
            "sections": []
        }

# Routes
@api_router.get("/")
async def root():
    return {"message": "Bible Study API"}

@api_router.get("/books")
async def get_books():
    """Get list of Bible books with chapter counts"""
    return {"books": BOOKS_CHAPTERS}

@api_router.post("/generate-study")
async def generate_study_post(request: StudyGenerationRequest):
    """Generate Bible study for given passage (POST method for frontend)"""
    try:
        # Fetch Bible passage
        passage = await fetch_bible_passage(request.passage, request.version)
        if not passage:
            raise HTTPException(status_code=404, detail="Passage not found")
        
        # Generate meditation study
        study = await generate_meditation_study(passage["text"], request.passage)
        
        # Save to database
        meditation_record = MeditationSave(
            reference=request.passage,
            passage_text=passage["text"],
            meditation_content=study["meditation"],
            sections=study["sections"]
        )
        
        await db.meditations.insert_one(meditation_record.dict())
        
        return StudyGenerationResponse(
            content=study["meditation"],
            reference=request.passage,
            sections=study["sections"]
        )
        
    except Exception as e:
        logging.error(f"Error in generate_study_post: {e}")
        # Return a fallback response
        fallback_content = f"""Méditation sur {request.passage}

1) Vérités clés
- Ce passage révèle l'amour profond de Dieu pour l'humanité
- La foi est le moyen par lequel nous recevons la grâce divine

2) Commentaire
Ce texte nous invite à contempler l'initiative divine dans notre salut. La méditation nous aide à comprendre que la relation avec Dieu commence par son amour pour nous.

3) Application pratique  
- Prenez du temps aujourd'hui pour remercier Dieu pour son amour
- Réfléchissez à comment cet amour peut transformer votre quotidien

4) Prière
Seigneur, merci pour ton amour révélé dans ce passage. Aide-moi à vivre cette vérité aujourd'hui. Amen."""
        
        return StudyGenerationResponse(
            content=fallback_content,
            reference=request.passage,
            sections=[]
        )

@api_router.get("/generate-study")
async def generate_study(ref: str, version: str = "LSG", length: int = 500):
    """Generate Bible study for given reference"""
    try:
        # Fetch Bible passage
        passage = await fetch_bible_passage(ref, version)
        if not passage:
            raise HTTPException(status_code=404, detail="Passage not found")
        
        # Generate meditation study
        study = await generate_meditation_study(passage["text"], ref)
        
        # Save to database
        meditation_record = MeditationSave(
            reference=ref,
            passage_text=passage["text"],
            meditation_content=study["meditation"],
            sections=study["sections"]
        )
        
        await db.meditations.insert_one(meditation_record.dict())
        
        return BibleStudyResponse(
            ok=True,
            reference=ref,
            bibleId=version,
            passage=passage,
            sections=study["sections"]
        )
        
    except Exception as e:
        logging.error(f"Error in generate_study: {e}")
        return BibleStudyResponse(
            ok=False,
            reference=ref,
            bibleId=version,
            error=str(e)
        )

@api_router.get("/meditations")
async def get_meditations(limit: int = 10):
    """Get recent meditations"""
    try:
        meditations = await db.meditations.find({}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(length=limit)
        return {"meditations": meditations}
    except Exception as e:
        logging.error(f"Error fetching meditations: {e}")
        return {"meditations": [], "error": str(e)}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()