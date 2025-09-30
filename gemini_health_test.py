#!/usr/bin/env python3
"""
Test de santé rapide du backend pour vérifier la configuration de la clé API Gemini personnelle
Selon la demande utilisateur: vérifier que la clé AIzaSyDro7GV39MHavUDnn3mms9Y1Ih3ZaGMbAg est bien configurée
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://theologystudy.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

def print_test_header(test_name):
    print(f"\n{'='*60}")
    print(f"🧪 {test_name}")
    print(f"{'='*60}")

def print_result(success, message):
    status = "✅ SUCCÈS" if success else "❌ ÉCHEC"
    print(f"{status}: {message}")

def test_health_endpoint():
    """Test 1: Vérifier que l'endpoint /api/health confirme que Gemini est activé"""
    print_test_header("TEST 1: Health Check - Configuration Gemini")
    
    try:
        response = requests.get(f"{API_BASE}/health", timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            print(f"📊 Réponse reçue: {json.dumps(data, indent=2, ensure_ascii=False)}")
            
            # Vérifications spécifiques
            if data.get("status") == "ok":
                print_result(True, "Backend opérationnel (status: ok)")
            else:
                print_result(False, f"Status inattendu: {data.get('status')}")
                return False
                
            if data.get("gemini_enabled") is True:
                print_result(True, "Gemini activé et configuré")
            else:
                print_result(False, f"Gemini non activé: {data.get('gemini_enabled')}")
                return False
                
            message = data.get("message", "")
            if "Personal Gemini key configured" in message:
                print_result(True, f"Clé personnelle confirmée: {message}")
                return True
            else:
                print_result(False, f"Message inattendu: {message}")
                return False
        else:
            print_result(False, f"Code de statut HTTP: {response.status_code}")
            return False
            
    except Exception as e:
        print_result(False, f"Erreur lors du test health: {str(e)}")
        return False

def test_verse_generation():
    """Test 2: Tester la génération avec un passage simple (Genèse 1:1)"""
    print_test_header("TEST 2: Génération Verset - Clé Gemini Personnelle")
    
    test_data = {
        "passage": "Genèse 1:1",
        "version": "LSG",
        "tokens": 500,
        "use_gemini": True,
        "enriched": True,
        "rubric_type": "verse_by_verse"
    }
    
    try:
        print(f"📤 Envoi de la requête: {json.dumps(test_data, indent=2, ensure_ascii=False)}")
        
        start_time = time.time()
        response = requests.post(
            f"{API_BASE}/generate-verse-by-verse",
            json=test_data,
            timeout=60
        )
        end_time = time.time()
        
        duration = end_time - start_time
        print(f"⏱️ Temps de réponse: {duration:.2f} secondes")
        
        if response.status_code == 200:
            data = response.json()
            content = data.get("content", "")
            
            print(f"📊 Métadonnées de réponse:")
            print(f"   - Passage: {data.get('passage')}")
            print(f"   - Version: {data.get('version')}")
            print(f"   - Tokens générés: {data.get('tokens')}")
            print(f"   - Gemini utilisé: {data.get('gemini_used')}")
            print(f"   - Coût: {data.get('cost')}")
            
            # Vérifications du contenu
            if len(content) > 100:
                print_result(True, f"Contenu généré: {len(content)} caractères")
            else:
                print_result(False, f"Contenu trop court: {len(content)} caractères")
                return False
            
            # Vérifier que c'est du contenu théologique en français
            french_theological_terms = [
                "Dieu", "création", "commencement", "théologique", "biblique",
                "Genèse", "verset", "Écriture", "divin", "Seigneur"
            ]
            
            found_terms = [term for term in french_theological_terms if term.lower() in content.lower()]
            
            if len(found_terms) >= 3:
                print_result(True, f"Contenu théologique français confirmé. Termes trouvés: {found_terms}")
            else:
                print_result(False, f"Contenu théologique insuffisant. Termes trouvés: {found_terms}")
                return False
            
            # Vérifier qu'il n'y a pas d'erreurs d'API
            error_indicators = ["erreur", "error", "failed", "échec", "non disponible"]
            has_errors = any(indicator.lower() in content.lower() for indicator in error_indicators)
            
            if not has_errors:
                print_result(True, "Aucune erreur d'API détectée dans le contenu")
            else:
                print_result(False, "Erreurs d'API détectées dans le contenu")
                return False
            
            # Afficher un extrait du contenu
            print(f"\n📝 Extrait du contenu généré:")
            print(f"{'─'*50}")
            print(content[:300] + "..." if len(content) > 300 else content)
            print(f"{'─'*50}")
            
            return True
            
        else:
            print_result(False, f"Code de statut HTTP: {response.status_code}")
            if response.text:
                print(f"Détails de l'erreur: {response.text}")
            return False
            
    except Exception as e:
        print_result(False, f"Erreur lors du test de génération: {str(e)}")
        return False

def main():
    """Exécution des tests de santé Gemini"""
    print(f"🚀 DÉBUT DES TESTS DE SANTÉ GEMINI")
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🔗 Backend URL: {BACKEND_URL}")
    print(f"🔑 Clé testée: AIzaSyDro7GV39MHavUDnn3mms9Y1Ih3ZaGMbAg")
    
    results = []
    
    # Test 1: Health Check
    health_ok = test_health_endpoint()
    results.append(("Health Check", health_ok))
    
    # Test 2: Génération de verset
    generation_ok = test_verse_generation()
    results.append(("Génération Verset", generation_ok))
    
    # Résumé final
    print_test_header("RÉSUMÉ FINAL")
    
    all_passed = True
    for test_name, passed in results:
        status = "✅ RÉUSSI" if passed else "❌ ÉCHOUÉ"
        print(f"{status}: {test_name}")
        if not passed:
            all_passed = False
    
    print(f"\n{'='*60}")
    if all_passed:
        print("🎉 TOUS LES TESTS RÉUSSIS - Clé Gemini personnelle fonctionnelle!")
        print("✅ Le backend confirme que Gemini est activé")
        print("✅ La génération produit du contenu théologique en français")
        print("✅ Aucune erreur d'API détectée")
    else:
        print("⚠️ CERTAINS TESTS ONT ÉCHOUÉ - Vérification nécessaire")
    print(f"{'='*60}")
    
    return all_passed

if __name__ == "__main__":
    main()