from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional
import os
import logging
import uuid
from datetime import datetime
from pathlib import Path
import asyncio

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Bible Study API")

# Create API router
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Pydantic models
class StudyRequest(BaseModel):
    passage: str
    density: Optional[str] = "500"  # Reduced default for faster generation
    model: Optional[str] = "ChatGPT"

class StudyResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    passage: str
    sections: dict
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StudySection(BaseModel):
    title: str
    content: str
    section_number: int

# Bible study generation function
async def generate_bible_study(passage: str, density: str = "2500") -> dict:
    """Generate comprehensive Bible study with 29 theological sections"""
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        # Initialize LLM chat
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="API key not configured")
            
        chat = LlmChat(
            api_key=api_key,
            session_id=f"bible-study-{uuid.uuid4()}",
            system_message=f"""Tu es un théologien expert spécialisé dans l'exégèse biblique. 
            Tu génères des études bibliques approfondies avec une approche théologique rigoureuse.
            Densité du contenu: {density} caractères par section minimum.
            
            IMPORTANT: Réponds UNIQUEMENT avec un JSON valide contenant les 29 sections numérotées de 0 à 28.
            Format requis:
            {{
                "0": {{"title": "Étude verset par verset", "content": "..."}},
                "1": {{"title": "Prière d'ouverture", "content": "..."}},
                "2": {{"title": "Structure littéraire", "content": "..."}},
                ...
                "28": {{"title": "Prière de conclusion", "content": "..."}}
            }}"""
        ).with_model("openai", "gpt-4o-mini")
        
        # Define the 29 theological sections
        sections_titles = [
            "Étude verset par verset",
            "Prière d'ouverture", 
            "Structure littéraire",
            "Thème doctrinal principal",
            "Contexte historique",
            "Contexte culturel",
            "Genre littéraire",
            "Analyse linguistique",
            "Références croisées",
            "Typologie christologique",
            "Application personnelle",
            "Christ dans le passage",
            "Enseignement moral",
            "Promesses divines",
            "Avertissements",
            "Caractère de Dieu révélé",
            "Nature humaine exposée",
            "Plan de salut",
            "Sanctification",
            "Eschatologie",
            "Ecclésiologie",
            "Missionnaire",
            "Adoration et louange",
            "Intercession",
            "Méditation contemplative",
            "Mémorisation",
            "Questions de réflexion",
            "Ressources complémentaires",
            "Prière de conclusion"
        ]
        
        # Check if it's a quick test (small density)
        if int(density) < 1000:
            prompt = f"""
            Génère une étude biblique complète mais CONCISE pour le passage: {passage}
            
            Crée exactement 29 sections avec les titres suivants:
            {chr(10).join([f"{i}. {title}" for i, title in enumerate(sections_titles)])}
            
            Chaque section doit contenir environ 100-200 mots de contenu théologique adapté au passage {passage}.
            SOIS CONCIS mais précis.
            
            Réponds UNIQUEMENT avec un JSON valide au format spécifié ci-dessus.
            """
        else:
            prompt = f"""
            Génère une étude biblique complète pour le passage: {passage}
            
            Crée exactement 29 sections avec les titres suivants:
            {chr(10).join([f"{i}. {title}" for i, title in enumerate(sections_titles)])}
            
            Chaque section doit contenir minimum {density} caractères de contenu théologique rigoureux.
            Adapte le contenu spécifiquement au passage {passage}.
            
            Réponds UNIQUEMENT avec un JSON valide au format spécifié ci-dessus.
            """
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse JSON response
        import json
        try:
            study_data = json.loads(response)
            return study_data
        except json.JSONDecodeError:
            # Fallback: extract JSON from response if wrapped in markdown
            import re
            json_match = re.search(r'```(?:json)?\s*(\{.*\})\s*```', response, re.DOTALL)
            if json_match:
                study_data = json.loads(json_match.group(1))
                return study_data
            else:
                raise HTTPException(status_code=500, detail="Failed to parse AI response")
                
    except Exception as e:
        logger.error(f"Error generating Bible study: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating study: {str(e)}")

# API Endpoints
@api_router.get("/")
async def root():
    return {
        "message": "Bible Study API", 
        "status": "active",
        "endpoints": ["/generate-study"]
    }

@api_router.post("/generate-study", response_model=StudyResponse)
async def generate_study(request: StudyRequest):
    """Generate a comprehensive Bible study"""
    try:
        logger.info(f"Generating study for passage: {request.passage}")
        
        # Generate the study content
        sections = await generate_bible_study(request.passage, request.density)
        
        # Create response
        study_response = StudyResponse(
            passage=request.passage,
            sections=sections
        )
        
        # Save to database
        study_dict = study_response.dict()
        await db.bible_studies.insert_one(study_dict)
        
        logger.info(f"Study generated successfully for: {request.passage}")
        return study_response
        
    except Exception as e:
        logger.error(f"Error in generate_study endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/studies", response_model=List[StudyResponse])
async def get_studies(limit: int = 10):
    """Get recent Bible studies"""
    try:
        studies = await db.bible_studies.find().sort("timestamp", -1).limit(limit).to_list(limit)
        return [StudyResponse(**study) for study in studies]
    except Exception as e:
        logger.error(f"Error fetching studies: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Include the API router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)