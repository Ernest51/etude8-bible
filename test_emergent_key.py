import requests
import json

# Test simple de la clé Emergent LLM
def test_emergent_key():
    key = "sk-emergent-3BcF2643421D02fC0E"
    
    # Test avec OpenAI via Emergent (petit prompt pour minimiser les coûts)
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }
    
    # Très petit test pour vérifier le statut de la clé
    payload = {
        "model": "gpt-4o-mini",  # Modèle le moins cher
        "messages": [
            {"role": "user", "content": "Test"}  # Message minimal
        ],
        "max_tokens": 5  # Très limité pour minimiser les coûts
    }
    
    try:
        print("🔍 Test de l'Universal Key Emergent...")
        
        # URL Emergent pour OpenAI
        response = requests.post(
            "https://api.emergentai.info/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Clé fonctionnelle")
            print(f"Modèle utilisé: {data.get('model')}")
            
            # Vérifier les headers pour info de facturation
            if 'x-ratelimit-remaining' in response.headers:
                print(f"Rate limit restant: {response.headers['x-ratelimit-remaining']}")
            if 'x-usage-cost' in response.headers:
                print(f"Coût de l'appel: {response.headers['x-usage-cost']}")
                
            return True
            
        elif response.status_code == 401:
            print("❌ Clé invalide ou expirée")
            return False
            
        elif response.status_code == 429:
            print("⚠️ Limite de taux atteinte - clé fonctionnelle mais temporairement limitée")
            return True
            
        elif response.status_code == 402:
            print("💳 Paiement requis - clé valide mais crédit insuffisant")
            return True
            
        else:
            print(f"❌ Erreur inconnue: {response.status_code}")
            print(f"Réponse: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Erreur lors du test: {str(e)}")
        return False

if __name__ == "__main__":
    test_emergent_key()
