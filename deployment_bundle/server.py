from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import os
import re
from datetime import datetime
from dotenv import load_dotenv
import google.generativeai as genai
from cache_fallback_system import cache_fallback

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
    rubric_type: str = Field("verse_by_verse", description="Type de rubrique")

class StudyRequest(BaseModel):
    passage: str = Field(..., description="Ex: 'Genèse 1' ou 'Jean 3:16'")
    version: str = Field("LSG", description="Version biblique")  
    tokens: int = Field(1000, description="Longueur cible par rubrique")
    selected_rubriques: list = Field(None, description="Liste des rubriques à générer (optionnel)")
    use_gemini: bool = Field(True, description="Utiliser Gemini")

# Fonction Gemini avec gestion d'erreur améliorée
async def generate_with_gemini_raw(prompt: str) -> str:
    """Fonction Gemini brute pour utilisation interne"""
    if not GEMINI_AVAILABLE:
        raise Exception("Gemini non disponible - clé API manquante")
    
    try:
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        response = model.generate_content(prompt)
        
        if response and response.text:
            print(f"✅ Content generated with personal Gemini (GRATUIT): {len(response.text)} chars")
            return response.text.strip()
        else:
            raise Exception("Gemini n'a pas retourné de contenu")
            
    except Exception as e:
        # Log l'erreur complète pour debugging
        error_msg = str(e)
        print(f"❌ Erreur Gemini: {error_msg}")
        
        # Vérifier si c'est une erreur de quota
        if "429" in error_msg or "quota" in error_msg.lower() or "exceeded" in error_msg.lower():
            raise Exception(f"QUOTA_EXCEEDED: {error_msg}")
        else:
            raise Exception(f"GEMINI_ERROR: {error_msg}")

# Nouvelle fonction principale avec cache et fallback
async def generate_with_smart_fallback(passage: str, tokens: int, use_gemini: bool, prompt: str) -> tuple:
    """
    Génération intelligente avec cache et fallback
    Retourne: (content, source, from_cache, error_message)
    """
    
    async def gemini_generator():
        return await generate_with_gemini_raw(prompt)
    
    try:
        content, source, from_cache = await cache_fallback.get_cached_or_generate(
            passage=passage,
            tokens=tokens,
            use_gemini=use_gemini,
            gemini_generator_func=gemini_generator
        )
        
        return content, source, from_cache, None
        
    except Exception as e:
        error_msg = f"Erreur système: {str(e)}"
        print(f"💥 Erreur dans generate_with_smart_fallback: {error_msg}")
        
        # En dernier recours, générer du contenu de fallback local
        fallback_content = await cache_fallback.generate_fallback_content(passage, tokens)
        return fallback_content, "Fallback d'urgence", False, error_msg

# Routes
@app.get("/")
async def root():
    return {"message": "Bible Study API avec clé Gemini personnelle GRATUITE"}

@app.get("/api/health")
async def health_check():
    try:
        # Vérifier le système de rotation Gemini
        quota_ok, quota_message = cache_fallback._check_gemini_quota()
        
        return {
            "status": "ok",
            "rotation_system": "Système de rotation activé",
            "gemini_keys": [
                f"{key['name']}: {'✅ Disponible' if not key.get('failed', False) else '❌ Quota dépassé'}" 
                for key in cache_fallback.gemini_keys
            ],
            "current_key": cache_fallback.gemini_keys[cache_fallback.quota_tracker.get("current_key_index", 0)]["name"],
            "bible_api_configured": True,
            "cache_entries": len(cache_fallback.cache),
            "message": "Études garanties sans interruption grâce à la rotation automatique",
            "features": [
                "🔑 Rotation automatique Gemini Keys",
                "📖 Bible API fallback",
                "📋 Cache intelligent (24h)",
                "♻️ Reset quotidien automatique"
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur système: {str(e)}")

@app.get("/api/api-status")
async def get_api_status():
    """
    Endpoint pour obtenir le statut en temps réel de toutes les API
    Utilisé par le panneau de contrôle frontend
    """
    try:
        status = cache_fallback.get_api_status()
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur récupération statut: {str(e)}")

@app.get("/api/api-history")
async def get_api_history():
    """
    Endpoint pour obtenir l'historique détaillé des appels API
    """
    try:
        history = getattr(cache_fallback, "call_history", [])
        return {
            "timestamp": datetime.now().isoformat(),
            "total_calls": len(history),
            "history": history[-20:]  # Les 20 derniers appels
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur récupération historique: {str(e)}")

@app.post("/api/generate-study")
async def generate_study(request: StudyRequest):
    """
    Génère une étude biblique en 28 rubriques avec Gemini intelligent
    """
    try:
        print(f"[GENERATE STUDY] Requête reçue: {request.passage}")
        
        # Liste des rubriques SYNCHRONISÉE avec le frontend (BASE_RUBRIQUES)
        rubriques_list = [
            "Étude verset par verset",
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
            "Plan d'action"
        ]
        
        # Déterminer quelles rubriques générer
        rubriques_to_generate = request.selected_rubriques if request.selected_rubriques else list(range(len(rubriques_list)))
        
        # Utiliser notre système de rotation Gemini avec prompt spécifique aux rubriques
        if request.use_gemini:
            # Créer un prompt spécifique pour les rubriques (pas les versets)
            rubriques_to_generate = request.selected_rubriques if request.selected_rubriques else [0, 1, 2, 3, 4]
            rubriques_names = []
            
            for idx, i in enumerate(rubriques_to_generate[:5]):
                if i < len(rubriques_list):
                    # Pour les rubriques à partir de l'index 1, utiliser i (pas i+1) car l'index correspond déjà au numéro affiché
                    # Index 0 = "Étude verset par verset" (pas numéroté), Index 1 = "Rubrique 1", etc.
                    if i == 0:
                        rubriques_names.append(f"Étude verset par verset: {rubriques_list[i]}")
                    else:
                        rubriques_names.append(f"Rubrique {i}: {rubriques_list[i]}")
            
            # Construire le prompt de manière explicite pour chaque rubrique demandée
            prompt_parts = []
            prompt_parts.append(f"Créez une étude biblique théologique pour le passage {request.passage}.")
            prompt_parts.append("")
            
            # Instructions spécifiques pour chaque rubrique
            for i in rubriques_to_generate[:5]:
                if i < len(rubriques_list):
                    if i == 0:
                        rubrique_title = f"Étude verset par verset: {rubriques_list[i]}"
                    else:
                        rubrique_title = f"Rubrique {i}: {rubriques_list[i]}"
                    
                    prompt_parts.append(f"Générez du contenu substantiel pour :")
                    prompt_parts.append(f"## {rubrique_title}")
                    prompt_parts.append(f"Adaptez spécifiquement au passage {request.passage}.")
                    prompt_parts.append("")
            
            prompt_parts.extend([
                "INSTRUCTIONS CRITIQUES :",
                "1. Utilisez EXACTEMENT les titres de rubriques indiqués ci-dessus",
                "2. Contenu unique et spécifique au passage biblique",
                "3. Langage théologique érudit et précis", 
                "4. 150-200 mots par rubrique minimum",
                "5. AUCUN contenu générique type 'sera généré automatiquement'",
                "",
                "IMPORTANT : Respectez EXACTEMENT la numérotation des rubriques demandées !"
            ])
            
            prompt = "\n".join(prompt_parts)
            
            # Essayer avec notre système de rotation Gemini
            try:
                gemini_content, gemini_source, success = await cache_fallback._try_gemini_with_rotation(prompt)
                
                if success and gemini_content:
                    # Vérifier que le contenu ne contient pas de format "VERSET"
                    if "**VERSET" not in gemini_content.upper():
                        print(f"✅ Étude 28 points générée avec {gemini_source}")
                        
                        # Corriger la numérotation des rubriques après génération
                        corrected_content = gemini_content
                        
                        # Si on a demandé une rubrique spécifique, corriger sa numérotation
                        if len(rubriques_to_generate) == 1:
                            requested_index = rubriques_to_generate[0]
                            if requested_index > 0:  # Pas pour l'étude verset par verset (index 0)
                                # Remplacer "Rubrique X:" par "Rubrique [correct_number]:" 
                                import re
                                pattern = r"## Rubrique \d+:"
                                replacement = f"## Rubrique {requested_index}:"
                                corrected_content = re.sub(pattern, replacement, corrected_content)
                                print(f"[CORRECTION] Numérotation corrigée pour Rubrique {requested_index}")
                        
                        return {
                            "content": corrected_content,
                            "passage": request.passage,
                            "version": request.version,
                            "source": gemini_source,
                            "rubriques_generated": len(rubriques_to_generate),
                            "from_cache": False
                        }
                    else:
                        print(f"⚠️ Contenu format verset détecté, régénération...")
                        
            except Exception as e:
                print(f"❌ Erreur rotation Gemini: {e}")
        
        # Si toutes les clés Gemini échouent, attendre 1 minute puis retenter
        retry_count = 0
        max_retries = 3
        
        while retry_count < max_retries:
            retry_count += 1
            print(f"🔄 Tentative {retry_count}/{max_retries} - Attente 60 secondes avant retry...")
            
            # Attendre 1 minute (en production) ou 5 secondes (en dev)
            import asyncio
            await asyncio.sleep(5)  # 5 secondes pour les tests, changer à 60 en production
            
            # Reset des clés et nouvelle tentative
            for key_info in cache_fallback.gemini_keys:
                key_info["failed"] = False
            cache_fallback.quota_tracker["current_key_index"] = 0
            
            print(f"🔄 Retry {retry_count}: Reset des clés Gemini et nouvelle tentative")
            
            try:
                gemini_content, gemini_source, success = await cache_fallback._try_gemini_with_rotation(prompt)
                if success and gemini_content:
                    print(f"✅ Retry {retry_count} réussi avec {gemini_source}")
                    # Appliquer la correction de numérotation si nécessaire
                    corrected_content = gemini_content
                    if len(rubriques_to_generate) == 1:
                        requested_index = rubriques_to_generate[0]
                        if requested_index > 0:
                            pattern = r"## Rubrique \d+:"
                            replacement = f"## Rubrique {requested_index}:"
                            corrected_content = re.sub(pattern, replacement, corrected_content)
                    return {"content": corrected_content}
            except Exception as retry_error:
                print(f"❌ Retry {retry_count} échoué: {retry_error}")
        
        print(f"🚫 Tous les retries Gemini ont échoué, utilisation Bible API théologique")
        
        # En dernier recours, utiliser la Bible API pour du contenu théologique authentique
        print(f"🔄 Bible API Théologique - Génération authentique")
        
        theological_content = []
        for i in rubriques_to_generate[:5]:  # Limiter à 5 pour commencer
            rubrique_title = rubriques_list[i]
            
            try:
                # Générer du vrai contenu théologique avec la Bible API
                content = await cache_fallback.generate_theological_content_with_bible_api(
                    request.passage, rubrique_title, i
                )
                
                # Formater avec le bon en-tête
                if i == 0:
                    header = f"## Étude verset par verset: {rubrique_title}"
                else:
                    header = f"## Rubrique {i}: {rubrique_title}"
                
                theological_content.append(f"{header}\n\n{content}")
                print(f"📖 Bible API Théologique: {rubrique_title} générée ({len(content)} chars)")
                
            except Exception as e:
                print(f"❌ Erreur Bible API Théologique pour {rubrique_title}: {e}")
                # En dernier recours seulement, message d'erreur explicite
                if i == 0:
                    header = f"## Étude verset par verset: {rubrique_title}"
                else:
                    header = f"## Rubrique {i}: {rubrique_title}"
                
                theological_content.append(f"""
{header}

⚠️ Toutes les API sont temporairement indisponibles. Nouvelle tentative dans 1 minute.
La génération théologique pour "{rubrique_title}" sera disponible sous peu.
                """.strip())
        
        fallback_text = "\n\n".join(theological_content)
        
        return {
            "content": fallback_text,
            "passage": request.passage,
            "version": request.version,
            "source": "Fallback théologique intelligent",
            "rubriques_generated": len(rubriques_to_generate[:5]),
            "from_cache": False
        }
        
    except Exception as e:
        print(f"❌ Erreur generate_study: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur génération étude: {str(e)}")

@app.post("/api/generate-verse-by-verse")
async def generate_verse_by_verse(request: VerseByVerseRequest):
    try:
        # Prompt adapté selon le type de rubrique
        if request.rubric_type == "verse_by_verse":
            # Prompt pour verset par verset (rubrique 0) - FORMAT EXACT POUR CSS
            prompt = f"""
Tu es un expert biblique. L'utilisateur a sélectionné "{request.passage}" version {request.version}.

GÉNÈRE MAINTENANT une étude verset par verset pour cette sélection utilisateur.

INSTRUCTIONS PRÉCISES :
- Si c'est un chapitre (ex: "Genèse 1") : génère EXACTEMENT LES 5 PREMIERS VERSETS de ce chapitre
- Si c'est un verset spécifique (ex: "Jean 3:16") : génère ce verset précis ET les 4 versets suivants (total 5)
- Si c'est une plage (ex: "Matthieu 5:1-10") : génère les 5 premiers versets de cette plage

PASSAGE SÉLECTIONNÉ : {request.passage}
VERSION : {request.version}

FORMAT EXACT OBLIGATOIRE (respecter précisément) :

**VERSET [numéro]**

**TEXTE BIBLIQUE :**
[texte exact du verset en version {request.version}]

**EXPLICATION THÉOLOGIQUE :**
[analyse théologique approfondie de 120-180 mots]

RÈGLES STRICTES :
- GÉNÈRE EXACTEMENT 5 VERSETS (ni plus, ni moins)
- GÉNÈRE DIRECTEMENT le contenu (pas de questions à l'utilisateur)
- Format EXACT : "**VERSET [numéro]**", "**TEXTE BIBLIQUE :**", "**EXPLICATION THÉOLOGIQUE :**"
- Texte biblique précis en version {request.version}
- Explications théologiques substantielles et pertinentes
- Commence IMMÉDIATEMENT par le contenu demandé

COMMENCE MAINTENANT LA GÉNÉRATION pour "{request.passage}" - GÉNÈRE EXACTEMENT 5 VERSETS :
"""
        else:
            # Prompt pour enrichissement de rubriques (1-28)
            prompt = f"""
Génère un contenu théologique enrichi pour la rubrique "{request.rubric_type}" sur le passage {request.passage}.

Instructions :
- Fournis une analyse théologique approfondie
- Longueur cible : {request.tokens} caractères environ
- Contenu spécifique à cette rubrique et ce passage
- Style académique mais accessible
- Inclus des références bibliques pertinentes

Rubrique : {request.rubric_type}
Passage : {request.passage}
"""
        
        # Générer avec système intelligent (cache + fallback)
        content, source, from_cache, error_msg = await generate_with_smart_fallback(
            passage=request.passage,
            tokens=request.tokens,
            use_gemini=request.use_gemini and GEMINI_AVAILABLE,
            prompt=prompt
        )
        
        # Préparer la réponse avec informations détaillées
        response_data = {
            "content": content,
            "passage": request.passage,
            "version": request.version,
            "tokens": len(content),
            "gemini_used": request.use_gemini and GEMINI_AVAILABLE,
            "rubric_type": request.rubric_type,
            "cost": "GRATUIT - Cache" if from_cache else ("GRATUIT - Votre clé Gemini personnelle" if source.startswith("Gemini") else "GRATUIT - Fallback intelligent"),
            "source": source,
            "from_cache": from_cache
        }
        
        # Ajouter l'erreur si présente (pour debug)
        if error_msg:
            response_data["debug_info"] = error_msg
        
        return response_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur génération: {str(e)}")

@app.post("/api/clear-cache")
async def clear_cache():
    """Endpoint pour vider le cache (utile pour les tests)"""
    cache_size = len(cache_fallback.cache)
    cache_fallback.cache.clear()
    
    return {
        "message": f"Cache cleared ({cache_size} entries removed)",
        "status": "success"
    }

@app.get("/api/cache-stats")
async def cache_stats():
    """Statistiques du cache et du système de fallback"""
    import time
    
    quota_ok, quota_msg = cache_fallback._check_gemini_quota()
    
    # Analyser le cache
    cache_info = []
    for key, entry in cache_fallback.cache.items():
        cache_info.append({
            "key": key[:16] + "...",  # Masquer la clé complète
            "source": entry.get("source", "unknown"),
            "content_length": len(entry.get("content", "")),
            "age_hours": round((time.time() - entry.get("timestamp", 0)) / 3600, 2)
        })
    
    return {
        "quota_status": quota_msg,
        "quota_available": quota_ok,
        "quota_used_today": cache_fallback.quota_tracker.get("gemini_calls_today", 0),
        "cache_entries": len(cache_fallback.cache),
        "cache_details": cache_info[:10],  # Limiter à 10 entrées pour l'affichage
        "bible_api_configured": bool(cache_fallback.bible_api_key),
        "system_status": "operational"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
