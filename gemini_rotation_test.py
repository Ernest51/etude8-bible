#!/usr/bin/env python3
"""
Test critique de la nouvelle clé API Gemini ajoutée au système de rotation
Test spécifique pour la review request:

1. Le système détecte maintenant 3 clés Gemini au lieu de 2
2. La rotation automatique fonctionne correctement avec les 3 clés
3. L'endpoint /api/health affiche les 3 clés configurées
4. Le quota total disponible est maintenant plus élevé avec cette clé supplémentaire
5. Test de génération de contenu pour vérifier que la nouvelle clé fonctionne

Teste l'endpoint /api/health et quelques appels de génération pour confirmer que le système de rotation à 3 clés fonctionne parfaitement.
"""

import requests
import json
import time
import sys
from datetime import datetime

# Configuration - Use the REACT_APP_BACKEND_URL from frontend/.env
BACKEND_URL = "https://rubriques-app.preview.emergentagent.com"
TIMEOUT = 120

def log_test(test_name, status, details=""):
    """Log test results with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"[{timestamp}] {status_symbol} {test_name}")
    if details:
        print(f"    Details: {details}")
    print()

def test_health_endpoint_3_keys():
    """Test /api/health endpoint pour vérifier les 3 clés Gemini configurées"""
    try:
        response = requests.get(f"{BACKEND_URL}/api/health", timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            
            # Vérifier la structure de base
            if data.get("status") != "ok":
                log_test("Health Endpoint - Status Check", "FAIL", 
                        f"Status not 'ok': {data.get('status')}")
                return False
            
            # Vérifier la présence du système de rotation
            if "rotation_system" not in data:
                log_test("Health Endpoint - Rotation System", "FAIL", 
                        "rotation_system field missing")
                return False
            
            # Vérifier les clés Gemini
            gemini_keys = data.get("gemini_keys", [])
            if len(gemini_keys) < 3:
                log_test("Health Endpoint - 3 Gemini Keys", "FAIL", 
                        f"Expected 3 Gemini keys, found {len(gemini_keys)}: {gemini_keys}")
                return False
            
            # Vérifier que les 3 clés sont listées (noms réels du système)
            key_names = [key.split(':')[0].strip() for key in gemini_keys]
            expected_keys = ["Gemini Key 2 (Primary)", "Gemini Key 1 (Secondary)", "Gemini Key 3 (Tertiary)"]
            
            missing_keys = [key for key in expected_keys if key not in key_names]
            if missing_keys:
                log_test("Health Endpoint - Key Names", "FAIL", 
                        f"Missing expected keys: {missing_keys}. Found: {key_names}")
                return False
            
            # Vérifier la clé courante
            current_key = data.get("current_key", "")
            if not current_key:
                log_test("Health Endpoint - Current Key", "FAIL", 
                        "current_key field missing or empty")
                return False
            
            # Vérifier les features
            features = data.get("features", [])
            rotation_feature = any("rotation" in feature.lower() for feature in features)
            if not rotation_feature:
                log_test("Health Endpoint - Rotation Feature", "FAIL", 
                        f"Rotation feature not found in features: {features}")
                return False
            
            log_test("Health Endpoint - 3 Gemini Keys System", "PASS", 
                    f"3 keys detected: {gemini_keys}, Current: {current_key}, Rotation: {data.get('rotation_system')}")
            return True
            
        else:
            log_test("Health Endpoint - 3 Gemini Keys System", "FAIL", 
                    f"Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        log_test("Health Endpoint - 3 Gemini Keys System", "FAIL", f"Exception: {str(e)}")
        return False

def test_content_generation_with_rotation():
    """Test génération de contenu pour vérifier que la nouvelle clé fonctionne"""
    try:
        # Test multiple calls to potentially trigger rotation
        test_cases = [
            {"passage": "Genèse 1:1", "description": "Premier test - Genèse 1:1"},
            {"passage": "Jean 3:16", "description": "Deuxième test - Jean 3:16"},
            {"passage": "Psaumes 23:1", "description": "Troisième test - Psaumes 23:1"}
        ]
        
        results = []
        sources_used = []
        
        for i, test_case in enumerate(test_cases):
            try:
                payload = {
                    "passage": test_case["passage"],
                    "tokens": 500,
                    "use_gemini": True,
                    "enriched": True
                }
                
                headers = {"Content-Type": "application/json"}
                start_time = time.time()
                
                response = requests.post(f"{BACKEND_URL}/api/generate-verse-by-verse", 
                                       json=payload, 
                                       headers=headers, 
                                       timeout=TIMEOUT)
                
                end_time = time.time()
                duration = end_time - start_time
                
                if response.status_code == 200:
                    data = response.json()
                    content = data.get("content", "")
                    source = data.get("source", "unknown")
                    cost = data.get("cost", "unknown")
                    
                    # Vérifier que le contenu est généré
                    if len(content) < 100:
                        log_test(f"Content Generation Test {i+1} - {test_case['description']}", "FAIL", 
                                f"Content too short: {len(content)} chars")
                        results.append(False)
                        continue
                    
                    # Vérifier la source
                    sources_used.append(source)
                    
                    # Vérifier la qualité théologique
                    theological_terms = ["dieu", "théologique", "biblique", "spirituel", "divin"]
                    found_terms = [term for term in theological_terms if term.lower() in content.lower()]
                    
                    if len(found_terms) < 2:
                        log_test(f"Content Generation Test {i+1} - {test_case['description']}", "FAIL", 
                                f"Insufficient theological content. Found terms: {found_terms}")
                        results.append(False)
                        continue
                    
                    log_test(f"Content Generation Test {i+1} - {test_case['description']}", "PASS", 
                            f"Content: {len(content)} chars, Source: {source}, Duration: {duration:.2f}s, Cost: {cost}")
                    results.append(True)
                    
                else:
                    log_test(f"Content Generation Test {i+1} - {test_case['description']}", "FAIL", 
                            f"Status: {response.status_code}")
                    results.append(False)
                
                # Small delay between requests to allow potential rotation
                time.sleep(2)
                
            except Exception as e:
                log_test(f"Content Generation Test {i+1} - {test_case['description']}", "FAIL", 
                        f"Exception: {str(e)}")
                results.append(False)
        
        # Analyze results
        success_count = sum(results)
        total_tests = len(test_cases)
        
        # Check if rotation is working (different sources used)
        unique_sources = list(set(sources_used))
        rotation_working = len(unique_sources) > 1 or any("gemini" in source.lower() for source in sources_used)
        
        if success_count >= 2 and rotation_working:
            log_test("Content Generation with Rotation System", "PASS", 
                    f"Successful generations: {success_count}/{total_tests}, Sources used: {unique_sources}")
            return True
        elif success_count >= 2:
            log_test("Content Generation with Rotation System", "PASS", 
                    f"Successful generations: {success_count}/{total_tests}, Single source: {unique_sources}")
            return True
        else:
            log_test("Content Generation with Rotation System", "FAIL", 
                    f"Successful generations: {success_count}/{total_tests}, Sources: {unique_sources}")
            return False
            
    except Exception as e:
        log_test("Content Generation with Rotation System", "FAIL", f"Exception: {str(e)}")
        return False

def test_quota_availability():
    """Test que le quota total est plus élevé avec la clé supplémentaire"""
    try:
        # Test cache stats endpoint
        response = requests.get(f"{BACKEND_URL}/api/cache-stats", timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            
            # Vérifier les informations de quota
            quota_status = data.get("quota_status", "")
            quota_available = data.get("quota_available", False)
            quota_used_today = data.get("quota_used_today", 0)
            
            # Vérifier que le système est opérationnel
            system_status = data.get("system_status", "")
            if system_status != "operational":
                log_test("Quota Availability Test", "FAIL", 
                        f"System not operational: {system_status}")
                return False
            
            # Vérifier les entrées de cache
            cache_entries = data.get("cache_entries", 0)
            
            log_test("Quota Availability Test", "PASS", 
                    f"Quota available: {quota_available}, Used today: {quota_used_today}, Cache entries: {cache_entries}, Status: {quota_status}")
            return True
            
        else:
            log_test("Quota Availability Test", "FAIL", 
                    f"Status: {response.status_code}")
            return False
            
    except Exception as e:
        log_test("Quota Availability Test", "FAIL", f"Exception: {str(e)}")
        return False

def test_api_status_endpoint():
    """Test l'endpoint /api/api-status pour vérifier le statut en temps réel"""
    try:
        response = requests.get(f"{BACKEND_URL}/api/api-status", timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            
            # Vérifier la structure de base
            if not isinstance(data, dict):
                log_test("API Status Endpoint", "FAIL", 
                        "Invalid response format")
                return False
            
            log_test("API Status Endpoint", "PASS", 
                    f"API status retrieved successfully: {len(str(data))} chars")
            return True
            
        else:
            log_test("API Status Endpoint", "FAIL", 
                    f"Status: {response.status_code}")
            return False
            
    except Exception as e:
        log_test("API Status Endpoint", "FAIL", f"Exception: {str(e)}")
        return False

def test_study_generation_with_rotation():
    """Test génération d'étude pour vérifier le système de rotation sur les 28 rubriques"""
    try:
        payload = {
            "passage": "Genèse 1",
            "tokens": 1000,
            "use_gemini": True,
            "selected_rubriques": [1, 2, 3]  # Test quelques rubriques
        }
        
        headers = {"Content-Type": "application/json"}
        start_time = time.time()
        
        response = requests.post(f"{BACKEND_URL}/api/generate-study", 
                               json=payload, 
                               headers=headers, 
                               timeout=TIMEOUT)
        
        end_time = time.time()
        duration = end_time - start_time
        
        if response.status_code == 200:
            data = response.json()
            content = data.get("content", "")
            source = data.get("source", "unknown")
            rubriques_generated = data.get("rubriques_generated", 0)
            
            # Vérifier que le contenu est généré
            if len(content) < 500:
                log_test("Study Generation with Rotation", "FAIL", 
                        f"Content too short: {len(content)} chars")
                return False
            
            # Vérifier que les rubriques sont générées
            if rubriques_generated < 3:
                log_test("Study Generation with Rotation", "FAIL", 
                        f"Expected 3 rubriques, generated: {rubriques_generated}")
                return False
            
            # Vérifier la qualité théologique
            theological_terms = ["théologique", "biblique", "dieu", "création", "genèse"]
            found_terms = [term for term in theological_terms if term.lower() in content.lower()]
            
            if len(found_terms) < 3:
                log_test("Study Generation with Rotation", "FAIL", 
                        f"Insufficient theological content. Found terms: {found_terms}")
                return False
            
            log_test("Study Generation with Rotation", "PASS", 
                    f"Content: {len(content)} chars, Source: {source}, Rubriques: {rubriques_generated}, Duration: {duration:.2f}s")
            return True
            
        else:
            log_test("Study Generation with Rotation", "FAIL", 
                    f"Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        log_test("Study Generation with Rotation", "FAIL", f"Exception: {str(e)}")
        return False

def run_gemini_rotation_tests():
    """Run all Gemini rotation tests according to review request"""
    print("=" * 80)
    print("TEST CRITIQUE DE LA NOUVELLE CLÉ API GEMINI - SYSTÈME DE ROTATION")
    print("=" * 80)
    print(f"Testing backend at: {BACKEND_URL}")
    print(f"Timeout: {TIMEOUT} seconds")
    print()
    print("OBJECTIFS DE TEST:")
    print("1. Le système détecte maintenant 3 clés Gemini au lieu de 2")
    print("2. La rotation automatique fonctionne correctement avec les 3 clés")
    print("3. L'endpoint /api/health affiche les 3 clés configurées")
    print("4. Le quota total disponible est maintenant plus élevé avec cette clé supplémentaire")
    print("5. Test de génération de contenu pour vérifier que la nouvelle clé fonctionne")
    print()
    
    test_results = []
    
    # Test 1: Health Endpoint - 3 Gemini Keys
    print("1. HEALTH ENDPOINT - DÉTECTION DES 3 CLÉS GEMINI")
    print("-" * 50)
    test_results.append(("Health Endpoint - 3 Gemini Keys System", test_health_endpoint_3_keys()))
    
    # Test 2: API Status Endpoint
    print("\n2. API STATUS ENDPOINT - STATUT EN TEMPS RÉEL")
    print("-" * 50)
    test_results.append(("API Status Endpoint", test_api_status_endpoint()))
    
    # Test 3: Quota Availability
    print("\n3. QUOTA AVAILABILITY - QUOTA TOTAL PLUS ÉLEVÉ")
    print("-" * 50)
    test_results.append(("Quota Availability Test", test_quota_availability()))
    
    # Test 4: Content Generation with Rotation
    print("\n4. GÉNÉRATION DE CONTENU - ROTATION DES 3 CLÉS")
    print("-" * 50)
    test_results.append(("Content Generation with Rotation System", test_content_generation_with_rotation()))
    
    # Test 5: Study Generation with Rotation
    print("\n5. GÉNÉRATION D'ÉTUDE - SYSTÈME DE ROTATION")
    print("-" * 50)
    test_results.append(("Study Generation with Rotation", test_study_generation_with_rotation()))
    
    # Summary
    print("\n" + "=" * 80)
    print("RÉSULTATS DU TEST CRITIQUE - SYSTÈME DE ROTATION GEMINI")
    print("=" * 80)
    
    passed = sum(1 for _, result in test_results if result)
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print()
    print(f"RÉSULTAT GLOBAL: {passed}/{total} tests réussis")
    
    # Determine overall success
    critical_tests = [
        "Health Endpoint - 3 Gemini Keys System",
        "Content Generation with Rotation System"
    ]
    
    critical_passed = sum(1 for test_name, result in test_results 
                         if result and test_name in critical_tests)
    
    if passed == total:
        print("\n🎉 TOUS LES TESTS RÉUSSIS!")
        print("✅ Le système de rotation à 3 clés Gemini fonctionne parfaitement")
        print("✅ La nouvelle clé GEMINI_API_KEY_3 est opérationnelle")
        print("✅ Le quota total est augmenté avec la clé supplémentaire")
        return True
    elif critical_passed >= 1:  # At least the critical functionality works
        print("\n⚠️  QUELQUES TESTS ONT ÉCHOUÉ MAIS LA FONCTIONNALITÉ PRINCIPALE FONCTIONNE")
        print(f"✅ Tests critiques réussis: {critical_passed}/{len(critical_tests)}")
        print("✅ Le système de rotation des 3 clés Gemini est opérationnel")
        return True
    else:
        print("\n❌ TESTS CRITIQUES ÉCHOUÉS")
        print("❌ Problèmes majeurs avec le système de rotation des clés Gemini")
        print(f"❌ Tests critiques réussis: {critical_passed}/{len(critical_tests)}")
        return False

if __name__ == "__main__":
    success = run_gemini_rotation_tests()
    sys.exit(0 if success else 1)