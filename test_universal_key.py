import asyncio
from emergentintegrations.llm.chat import LlmChat, UserMessage
import os
from dotenv import load_dotenv

async def test_universal_key():
    print("🔍 Test de l'Universal Key Emergent...")
    
    # Utiliser la clé récupérée
    api_key = "sk-emergent-3BcF2643421D02fC0E"
    print(f"Clé: {api_key[:20]}...")
    
    try:
        # Initialiser le chat avec la clé Universal
        chat = LlmChat(
            api_key=api_key,
            session_id="test-session",
            system_message="You are a helpful assistant."
        ).with_model("openai", "gpt-4o-mini")  # Utiliser le modèle le moins cher
        
        # Créer un message minimal pour tester
        user_message = UserMessage(
            text="Hi"
        )
        
        print("📡 Envoi du message de test...")
        
        # Envoyer le message
        response = await chat.send_message(user_message)
        
        if response:
            print("✅ Universal Key FONCTIONNELLE")
            print(f"Réponse reçue: {response[:100]}...")
            print("💳 Cette clé utilise un système de crédits payant")
            print("📊 Vous pouvez gérer votre solde dans Profil → Universal Key")
            return True
        else:
            print("❌ Pas de réponse reçue")
            return False
            
    except Exception as e:
        error_msg = str(e).lower()
        print(f"❌ Erreur: {str(e)}")
        
        if "insufficient" in error_msg or "credit" in error_msg or "balance" in error_msg:
            print("💳 CLÉS PAYANTE - Crédit insuffisant")
            print("💰 Vous devez recharger votre Universal Key")
            print("📍 Allez dans Profil → Universal Key → Add Balance")
            return "insufficient_credit"
            
        elif "rate" in error_msg or "quota" in error_msg:
            print("⚠️ Limite de taux atteinte - la clé fonctionne mais est temporairement limitée")
            return "rate_limited"
            
        elif "auth" in error_msg or "invalid" in error_msg:
            print("🔑 Problème d'authentification avec la clé")
            return False
            
        else:
            print(f"❓ Erreur inconnue: {str(e)}")
            return False

if __name__ == "__main__":
    result = asyncio.run(test_universal_key())
    
    if result is True:
        print("\n🎉 RÉSUMÉ: Universal Key active et fonctionnelle (utilise des crédits)")
    elif result == "insufficient_credit":
        print("\n💳 RÉSUMÉ: Universal Key valide mais crédit insuffisant (rechargeable)")
    elif result == "rate_limited":
        print("\n⚠️ RÉSUMÉ: Universal Key valide mais temporairement limitée")
    else:
        print("\n❌ RÉSUMÉ: Problème avec l'Universal Key")
