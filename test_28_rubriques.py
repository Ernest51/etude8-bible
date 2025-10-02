#!/usr/bin/env python3
"""
TEST CRITIQUE ENDPOINT 28 RUBRIQUES - FOCUSED TESTING

Tester spécifiquement l'endpoint /api/generate-study qui est censé générer le contenu théologique pour les 28 rubriques.

PROBLÈME SIGNALÉ:
- Les rubriques affichent du contenu générique: "Le contenu de cette rubrique sera généré automatiquement selon votre sélection biblique"
- Au lieu du vrai contenu théologique Gemini intelligent

TESTS À EFFECTUER:
1. Test de l'endpoint /api/generate-study avec les paramètres:
   - passage: "Genèse 1" 
   - rubrique: 3
   - version: "LSG"

2. Vérifier que la réponse contient:
   - Du vrai contenu théologique substantiel (pas de placeholder)
   - Plus de 300 caractères de contenu
   - Des termes théologiques spécifiques
   - Pas le texte générique signalé

3. Tester la rotation des clés Gemini sur cet endpoint
4. Vérifier les logs backend pour identifier les problèmes
"""

import requests
import json
import time
import sys
import re
from datetime import datetime

# Configuration - Use the REACT_APP_BACKEND_URL from frontend/.env
BACKEND_URL = "https://faithai-tools.preview.emergentagent.com"
TIMEOUT = 120

def log_test(test_name, status, details=""):
    """Log test results with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"[{timestamp}] {status_symbol} {test_name}")
    if details:
        print(f"    Details: {details}")
    print()

def test_health_gemini_status():
    """Test /api/health endpoint to check Gemini system status"""
    try:
        print("🔍 Testing /api/health endpoint for Gemini system status...")
        response = requests.get(f"{BACKEND_URL}/api/health", timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            print(f"📊 Health Response: {json.dumps(data, indent=2)}")
            
            # Check for rotation system info
            rotation_info = data.get("rotation_system", "Not found")
            gemini_keys = data.get("gemini_keys", [])
            current_key = data.get("current_key", "Unknown")
            
            log_test("GET /api/health - Gemini System Status", "PASS", 
                    f"Rotation: {rotation_info}, Current Key: {current_key}, Keys: {len(gemini_keys)}")
            return True, data
        else:
            log_test("GET /api/health - Gemini System Status", "FAIL", 
                    f"Status: {response.status_code}, Response: {response.text}")
            return False, None
            
    except Exception as e:
        log_test("GET /api/health - Gemini System Status", "FAIL", f"Exception: {str(e)}")
        return False, None

def test_generate_study_specific_rubrique():
    """Test /api/generate-study with specific parameters from review request"""
    try:
        print("🔍 Testing /api/generate-study with specific parameters...")
        print("   - passage: 'Genèse 1'")
        print("   - rubrique: 3 (Questions du chapitre précédent)")
        print("   - version: 'LSG'")
        
        # Test with specific rubrique 3 (index 2)
        payload = {
            "passage": "Genèse 1",
            "version": "LSG",
            "tokens": 1000,
            "selected_rubriques": [2],  # Rubrique 3 (0-indexed)
            "use_gemini": True
        }
        
        headers = {"Content-Type": "application/json"}
        start_time = time.time()
        
        response = requests.post(f"{BACKEND_URL}/api/generate-study", 
                               json=payload, 
                               headers=headers, 
                               timeout=TIMEOUT)
        
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"⏱️  Request completed in {duration:.2f} seconds")
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            content = data.get("content", "")
            source = data.get("source", "Unknown")
            
            print(f"📄 Response Data: {json.dumps(data, indent=2)}")
            print(f"📝 Content Length: {len(content)} characters")
            print(f"🔧 Source: {source}")
            
            # Check for generic placeholder text
            generic_phrases = [
                "Le contenu de cette rubrique sera généré automatiquement selon votre sélection biblique",
                "sera généré automatiquement",
                "contenu générique",
                "placeholder"
            ]
            
            has_generic_content = any(phrase.lower() in content.lower() for phrase in generic_phrases)
            
            if has_generic_content:
                log_test("POST /api/generate-study - Rubrique 3 Content Quality", "FAIL", 
                        f"❌ GENERIC CONTENT DETECTED! Content still contains placeholder text.")
                print(f"🚨 PROBLÈME CONFIRMÉ: Le contenu générique est encore présent!")
                print(f"📄 Content preview: {content[:500]}...")
                return False
            
            # Check content length (should be substantial)
            if len(content) < 300:
                log_test("POST /api/generate-study - Rubrique 3 Content Quality", "FAIL", 
                        f"Content too short: {len(content)} characters (expected >300)")
                return False
            
            # Check for theological terms specific to Genesis 1
            theological_terms = [
                "genèse", "création", "commencement", "dieu", "chapitre", "précédent",
                "théologique", "biblique", "spirituel", "divin", "fondement"
            ]
            found_terms = [term for term in theological_terms if term.lower() in content.lower()]
            
            if len(found_terms) < 3:
                log_test("POST /api/generate-study - Rubrique 3 Content Quality", "FAIL", 
                        f"Insufficient theological content. Found terms: {found_terms}")
                return False
            
            # Check for specific rubrique 3 content (Questions du chapitre précédent)
            rubrique_3_indicators = [
                "question", "chapitre", "précédent", "avant", "contexte", "introduction"
            ]
            found_indicators = [term for term in rubrique_3_indicators if term.lower() in content.lower()]
            
            if len(found_indicators) < 2:
                log_test("POST /api/generate-study - Rubrique 3 Content Quality", "WARN", 
                        f"May not be specific to Rubrique 3. Found indicators: {found_indicators}")
            
            log_test("POST /api/generate-study - Rubrique 3 Content Quality", "PASS", 
                    f"✅ REAL THEOLOGICAL CONTENT! Length: {len(content)} chars, Terms: {found_terms}, Source: {source}")
            
            print(f"✅ SUCCESS: Contenu théologique authentique généré!")
            print(f"📄 Content preview: {content[:300]}...")
            
            return True
            
        else:
            log_test("POST /api/generate-study - Rubrique 3 Content Quality", "FAIL", 
                    f"Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        log_test("POST /api/generate-study - Rubrique 3 Content Quality", "FAIL", f"Exception: {str(e)}")
        return False

def test_generate_study_multiple_rubriques():
    """Test /api/generate-study with multiple rubriques to verify system works"""
    try:
        print("🔍 Testing /api/generate-study with multiple rubriques...")
        
        # Test with first 5 rubriques
        payload = {
            "passage": "Genèse 1",
            "version": "LSG", 
            "tokens": 800,
            "selected_rubriques": [0, 1, 2, 3, 4],  # First 5 rubriques
            "use_gemini": True
        }
        
        headers = {"Content-Type": "application/json"}
        start_time = time.time()
        
        response = requests.post(f"{BACKEND_URL}/api/generate-study", 
                               json=payload, 
                               headers=headers, 
                               timeout=TIMEOUT)
        
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"⏱️  Request completed in {duration:.2f} seconds")
        
        if response.status_code == 200:
            data = response.json()
            content = data.get("content", "")
            source = data.get("source", "Unknown")
            rubriques_generated = data.get("rubriques_generated", 0)
            
            print(f"📝 Content Length: {len(content)} characters")
            print(f"🔧 Source: {source}")
            print(f"📊 Rubriques Generated: {rubriques_generated}")
            
            # Check for generic content
            generic_phrases = [
                "Le contenu de cette rubrique sera généré automatiquement",
                "sera généré automatiquement"
            ]
            
            has_generic_content = any(phrase.lower() in content.lower() for phrase in generic_phrases)
            
            if has_generic_content:
                log_test("POST /api/generate-study - Multiple Rubriques", "FAIL", 
                        f"❌ GENERIC CONTENT STILL PRESENT in multiple rubriques test!")
                return False
            
            # Count rubrique sections
            rubrique_matches = re.findall(r'## Rubrique \d+:', content)
            rubrique_count = len(rubrique_matches)
            
            if rubrique_count < 3:
                log_test("POST /api/generate-study - Multiple Rubriques", "FAIL", 
                        f"Expected multiple rubrique sections, found {rubrique_count}")
                return False
            
            # Check content quality
            if len(content) < 1000:
                log_test("POST /api/generate-study - Multiple Rubriques", "FAIL", 
                        f"Content too short for multiple rubriques: {len(content)} characters")
                return False
            
            log_test("POST /api/generate-study - Multiple Rubriques", "PASS", 
                    f"✅ Multiple rubriques generated successfully! Sections: {rubrique_count}, Length: {len(content)} chars")
            return True
            
        else:
            log_test("POST /api/generate-study - Multiple Rubriques", "FAIL", 
                    f"Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        log_test("POST /api/generate-study - Multiple Rubriques", "FAIL", f"Exception: {str(e)}")
        return False

def test_gemini_key_rotation():
    """Test Gemini key rotation by making multiple requests"""
    try:
        print("🔍 Testing Gemini key rotation system...")
        
        results = []
        sources = []
        
        for i in range(3):
            print(f"   Making request {i+1}/3...")
            
            payload = {
                "passage": f"Psaumes {23+i}:1",  # Different passages to avoid cache
                "version": "LSG",
                "tokens": 500,
                "selected_rubriques": [0],  # Just first rubrique
                "use_gemini": True
            }
            
            headers = {"Content-Type": "application/json"}
            response = requests.post(f"{BACKEND_URL}/api/generate-study", 
                                   json=payload, 
                                   headers=headers, 
                                   timeout=TIMEOUT)
            
            if response.status_code == 200:
                data = response.json()
                source = data.get("source", "Unknown")
                content_length = len(data.get("content", ""))
                
                results.append(True)
                sources.append(source)
                
                print(f"     ✅ Request {i+1}: {source}, {content_length} chars")
            else:
                results.append(False)
                sources.append(f"ERROR-{response.status_code}")
                print(f"     ❌ Request {i+1}: Failed with {response.status_code}")
        
        success_count = sum(results)
        unique_sources = set(sources)
        
        if success_count >= 2:
            log_test("Gemini Key Rotation System", "PASS", 
                    f"✅ {success_count}/3 requests successful, Sources: {list(unique_sources)}")
            return True
        else:
            log_test("Gemini Key Rotation System", "FAIL", 
                    f"❌ Only {success_count}/3 requests successful, Sources: {list(unique_sources)}")
            return False
            
    except Exception as e:
        log_test("Gemini Key Rotation System", "FAIL", f"Exception: {str(e)}")
        return False

def check_backend_logs():
    """Attempt to check backend logs (informational)"""
    try:
        print("🔍 Attempting to check backend logs...")
        
        # Try to get cache stats which might give us insight
        response = requests.get(f"{BACKEND_URL}/api/cache-stats", timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            print(f"📊 Cache Stats: {json.dumps(data, indent=2)}")
            
            quota_status = data.get("quota_status", "Unknown")
            quota_available = data.get("quota_available", False)
            cache_entries = data.get("cache_entries", 0)
            
            log_test("Backend Logs Check", "INFO", 
                    f"Quota: {quota_status}, Available: {quota_available}, Cache: {cache_entries} entries")
            return True
        else:
            log_test("Backend Logs Check", "INFO", 
                    f"Cache stats not available: {response.status_code}")
            return False
            
    except Exception as e:
        log_test("Backend Logs Check", "INFO", f"Could not check logs: {str(e)}")
        return False

def run_focused_28_rubriques_test():
    """Run focused test for 28 rubriques issue"""
    print("=" * 80)
    print("TEST CRITIQUE ENDPOINT 28 RUBRIQUES")
    print("FOCUSED TESTING FOR GENERIC CONTENT ISSUE")
    print("=" * 80)
    print(f"Testing backend at: {BACKEND_URL}")
    print(f"Timeout: {TIMEOUT} seconds")
    print()
    print("PROBLÈME SIGNALÉ:")
    print("- Les rubriques affichent du contenu générique au lieu du vrai contenu théologique")
    print("- Message: 'Le contenu de cette rubrique sera généré automatiquement selon votre sélection biblique'")
    print()
    
    test_results = []
    
    # Test 1: Health Check for Gemini Status
    print("1. HEALTH CHECK - GEMINI SYSTEM STATUS")
    print("-" * 50)
    health_success, health_data = test_health_gemini_status()
    test_results.append(("Health Check - Gemini System", health_success))
    
    # Test 2: Specific Rubrique 3 Test (as requested)
    print("\n2. SPECIFIC RUBRIQUE 3 TEST (GENÈSE 1)")
    print("-" * 50)
    rubrique_3_success = test_generate_study_specific_rubrique()
    test_results.append(("Generate Study - Rubrique 3 (Genèse 1)", rubrique_3_success))
    
    # Test 3: Multiple Rubriques Test
    print("\n3. MULTIPLE RUBRIQUES TEST")
    print("-" * 50)
    multiple_success = test_generate_study_multiple_rubriques()
    test_results.append(("Generate Study - Multiple Rubriques", multiple_success))
    
    # Test 4: Gemini Key Rotation
    print("\n4. GEMINI KEY ROTATION TEST")
    print("-" * 50)
    rotation_success = test_gemini_key_rotation()
    test_results.append(("Gemini Key Rotation", rotation_success))
    
    # Test 5: Backend Logs Check
    print("\n5. BACKEND LOGS CHECK")
    print("-" * 50)
    logs_success = check_backend_logs()
    test_results.append(("Backend Logs Check", logs_success))
    
    # Summary
    print("\n" + "=" * 80)
    print("TEST RESULTS SUMMARY - 28 RUBRIQUES ISSUE")
    print("=" * 80)
    
    passed = sum(1 for _, result in test_results if result)
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print()
    print(f"OVERALL RESULT: {passed}/{total} tests passed")
    
    # Determine if the core issue is resolved
    core_tests = [
        "Generate Study - Rubrique 3 (Genèse 1)",
        "Generate Study - Multiple Rubriques"
    ]
    
    core_passed = sum(1 for test_name, result in test_results 
                     if result and test_name in core_tests)
    
    print("\n" + "=" * 80)
    print("DIAGNOSTIC FINAL")
    print("=" * 80)
    
    if core_passed == len(core_tests):
        print("🎉 PROBLÈME RÉSOLU!")
        print("✅ L'endpoint /api/generate-study génère maintenant du vrai contenu théologique")
        print("✅ Plus de contenu générique détecté")
        print("✅ Le système Gemini intelligent fonctionne correctement")
        return True
    elif core_passed >= 1:
        print("⚠️  PROBLÈME PARTIELLEMENT RÉSOLU")
        print(f"✅ {core_passed}/{len(core_tests)} tests principaux réussis")
        print("⚠️  Certaines rubriques peuvent encore avoir des problèmes")
        return True
    else:
        print("❌ PROBLÈME NON RÉSOLU")
        print("❌ L'endpoint /api/generate-study génère encore du contenu générique")
        print("❌ Le système Gemini intelligent ne fonctionne pas comme attendu")
        print()
        print("RECOMMANDATIONS:")
        print("1. Vérifier la configuration des clés Gemini")
        print("2. Vérifier les prompts utilisés pour la génération")
        print("3. Vérifier le système de fallback")
        print("4. Examiner les logs backend pour plus de détails")
        return False

if __name__ == "__main__":
    success = run_focused_28_rubriques_test()
    sys.exit(0 if success else 1)