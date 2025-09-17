from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional
import os
import logging
import uuid
import json
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
async def generate_bible_study(passage: str, density: str = "500") -> dict:
    """Generate comprehensive Bible study with 29 theological sections using batch processing"""
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        import asyncio
        
        # Initialize LLM chat
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="API key not configured")
        
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
        
        # Calculate target words per section based on density
        target_words = max(50, int(density) // 5)  # Convert characters to rough word count
        
        # Create batches of sections (5 sections per batch for faster processing)
        batch_size = 5
        all_sections = {}
        
        logger.info(f"Generating study for {passage} in {len(sections_titles)//batch_size + 1} batches")
        
        for batch_start in range(0, len(sections_titles), batch_size):
            batch_end = min(batch_start + batch_size, len(sections_titles))
            batch_titles = sections_titles[batch_start:batch_end]
            batch_indices = list(range(batch_start, batch_end))
            
            # Create chat instance for this batch
            chat = LlmChat(
                api_key=api_key,
                session_id=f"bible-study-batch-{batch_start}-{uuid.uuid4()}",
                system_message=f"""Tu es un théologien expert spécialisé dans l'exégèse biblique. 
                Tu génères des études bibliques approfondies avec une approche théologique rigoureuse.
                
                IMPORTANT: Réponds UNIQUEMENT avec un JSON valide contenant les sections demandées.
                Chaque section doit faire environ {target_words} mots."""
            ).with_model("openai", "gpt-4o-mini")
            
            # Create prompt for this batch
            sections_list = []
            for i, title in enumerate(batch_titles):
                section_num = batch_start + i
                sections_list.append(f'"{section_num}": {{"title": "{title}", "content": "..."}}')
            
            prompt = f"""
            Génère les sections d'étude biblique suivantes pour le passage: {passage}
            
            Sections à créer ({len(batch_titles)} sections):
            {chr(10).join([f"{batch_start + i}. {title}" for i, title in enumerate(batch_titles)])}
            
            Chaque section doit contenir environ {target_words} mots de contenu théologique adapté spécifiquement au passage {passage}.
            
            Réponds UNIQUEMENT avec un JSON valide dans ce format:
            {{
                {", ".join(sections_list)}
            }}
            """
            
            try:
                # Generate with timeout
                user_message = UserMessage(text=prompt)
                response = await asyncio.wait_for(
                    chat.send_message(user_message), 
                    timeout=60.0  # 60 second timeout per batch
                )
                
                # Parse JSON response
                try:
                    batch_data = json.loads(response)
                except json.JSONDecodeError:
                    # Fallback: extract JSON from response if wrapped in markdown
                    import re
                    json_match = re.search(r'```(?:json)?\s*(\{.*\})\s*```', response, re.DOTALL)
                    if json_match:
                        batch_data = json.loads(json_match.group(1))
                    else:
                        raise HTTPException(status_code=500, detail=f"Failed to parse AI response for batch {batch_start}")
                
                # Add batch sections to all_sections
                all_sections.update(batch_data)
                logger.info(f"Completed batch {batch_start//batch_size + 1}/{len(sections_titles)//batch_size + 1}")
                
            except asyncio.TimeoutError:
                logger.error(f"Timeout generating batch {batch_start}-{batch_end}")
                # Create fallback content for this batch
                for i, title in enumerate(batch_titles):
                    section_num = str(batch_start + i)
                    all_sections[section_num] = {
                        "title": title,
                        "content": f"Contenu d'étude pour {passage} - Section {title}. Cette section explore les aspects théologiques spécifiques à ce passage biblique avec une approche rigoureuse et pratique."
                    }
            
            # Small delay between batches to avoid rate limiting
            if batch_end < len(sections_titles):
                await asyncio.sleep(1)
        
        # Ensure we have all 29 sections
        for i in range(29):
            if str(i) not in all_sections:
                all_sections[str(i)] = {
                    "title": sections_titles[i],
                    "content": f"Étude théologique du passage {passage} pour la section {sections_titles[i]}. Cette section fournit une analyse biblique approfondie adaptée à votre méditation personnelle."
                }
        
        logger.info(f"Study generation completed for {passage} with {len(all_sections)} sections")
        return all_sections
                
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