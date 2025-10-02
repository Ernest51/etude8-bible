import os
import google.generativeai as genai
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

def test_personal_gemini_key():
    print("🔍 Test de votre clé Gemini personnelle...")
    
    # Récupérer votre clé personnelle
    gemini_key = os.getenv("GEMINI_API_KEY")
    
    if not gemini_key:
        print("❌ Clé GEMINI_API_KEY non trouvée dans .env")
        return False
    
    print(f"Clé: {gemini_key[:20]}...")
    
    try:
        # Configurer Gemini avec votre clé
        genai.configure(api_key=gemini_key)
        
        # Utiliser le modèle Gemini Flash (gratuit)
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        # Test simple
        print("📡 Test de génération...")
        response = model.generate_content("Répondez simplement: 'Test réussi'")
        
        if response and response.text:
            print("✅ CLÉ GEMINI PERSONNELLE FONCTIONNELLE")
            print(f"Réponse: {response.text}")
            print("💰 GRATUIT - Aucun crédit Emergent consommé!")
            return True
        else:
            print("❌ Pas de réponse reçue")
            return False
            
    except Exception as e:
        error_msg = str(e).lower()
        print(f"❌ Erreur: {str(e)}")
        
        if "quota" in error_msg or "limit" in error_msg:
            print("⚠️ Quota API dépassé - attendez demain ou vérifiez vos limites Google")
        elif "invalid" in error_msg or "auth" in error_msg:
            print("🔑 Clé API invalide - vérifiez votre clé Google AI Studio")
        elif "region" in error_msg:
            print("🌍 Problème de région - vérifiez que l'API est activée dans votre région")
        
        return False

if __name__ == "__main__":
    if test_personal_gemini_key():
        print("\n🎉 SUCCÈS: Votre clé Gemini personnelle fonctionne!")
        print("💸 ÉCONOMIES: Plus de crédits Emergent consommés pour Gemini")
    else:
        print("\n❌ ÉCHEC: Problème avec votre clé Gemini personnelle")
