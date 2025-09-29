import requests
import json

def test_emergent_key_status():
    key = "sk-emergent-3BcF2643421D02fC0E"
    
    # URLs possibles pour l'API Emergent
    possible_urls = [
        "https://api.openai.com/v1/chat/completions",  # Via proxy Emergent
        "https://emergent.api/v1/chat/completions",
        "https://api.emergent.com/v1/chat/completions"
    ]
    
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "User-Agent": "Emergent-Test"
    }
    
    # Test minimal pour vérifier le statut
    payload = {
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": "Hi"}],
        "max_tokens": 1
    }
    
    print("🔍 Test de l'Universal Key Emergent...")
    print(f"Clé: {key[:20]}...")
    
    # Test simple pour vérifier le format de la clé
    if not key.startswith("sk-emergent-"):
        print("❌ Format de clé invalide")
        return False
    
    print("✅ Format de clé valide (sk-emergent-*)")
    
    # Essayer de faire un appel simple
    try:
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 401:
            error_data = response.json() if response.content else {}
            error_msg = error_data.get("error", {}).get("message", "Clé invalide")
            print(f"❌ Authentification échouée: {error_msg}")
            
            if "billing" in error_msg.lower() or "payment" in error_msg.lower():
                print("💳 Problème de facturation détecté")
            elif "invalid" in error_msg.lower():
                print("🔑 Clé probablement invalide ou expirée")
                
        elif response.status_code == 200:
            print("✅ Clé fonctionnelle et facturée correctement")
            
        elif response.status_code == 429:
            print("⚠️ Rate limit atteint - clé valide")
            
        else:
            print(f"Status inattendu: {response.status_code}")
            print(f"Réponse: {response.text[:200]}...")
            
    except Exception as e:
        print(f"Erreur de connexion: {str(e)}")
    
    return True

if __name__ == "__main__":
    test_emergent_key_status()
