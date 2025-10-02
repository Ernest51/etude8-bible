#!/usr/bin/env python3
"""
Focused Backend Test for Review Request
Test rapide de l'API /api/generate-verse-by-verse pour vérifier si le backend fonctionne correctement.

Contexte: L'utilisateur rapporte un bug avec le bouton "VERSETS PROG" qui ne fonctionne pas. 
Nous avons modifié le code frontend mais aucun log n'apparaît quand on clique sur le bouton.

Test à effectuer:
1. Test de l'endpoint /api/generate-verse-by-verse avec le payload: 
   {"passage":"Genèse 1","version":"LSG","tokens":500,"use_gemini":true,"enriched":true}
2. Vérifier que la réponse contient du contenu théologique en français
3. Vérifier que les temps de réponse sont raisonnables
4. S'assurer qu'il n'y a pas d'erreur côté backend qui pourrait expliquer pourquoi le frontend ne fonctionne pas
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

def test_exact_review_request():
    """Test the exact endpoint and payload from the review request"""
    print("🎯 TESTING EXACT REVIEW REQUEST PAYLOAD")
    print("=" * 60)
    
    try:
        # Exact payload from review request
        payload = {
            "passage": "Genèse 1",
            "version": "LSG", 
            "tokens": 500,
            "use_gemini": True,
            "enriched": True
        }
        
        print(f"Testing endpoint: {BACKEND_URL}/api/generate-verse-by-verse")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        print()
        
        headers = {"Content-Type": "application/json"}
        
        # Measure response time
        start_time = time.time()
        
        response = requests.post(f"{BACKEND_URL}/api/generate-verse-by-verse", 
                               json=payload, 
                               headers=headers, 
                               timeout=TIMEOUT)
        
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"⏱️  Response time: {duration:.2f} seconds")
        print(f"📊 HTTP Status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                content = data.get("content", "")
                
                print(f"📝 Content length: {len(content)} characters")
                print(f"🔧 Response keys: {list(data.keys())}")
                
                # Check for French theological content
                french_theological_terms = [
                    "dieu", "création", "commencement", "théologique", "biblique", 
                    "verset", "genèse", "créa", "cieux", "terre", "spirituel", "divin"
                ]
                
                found_terms = []
                for term in french_theological_terms:
                    if term.lower() in content.lower():
                        found_terms.append(term)
                
                print(f"🇫🇷 French theological terms found: {found_terms}")
                
                # Check for verse structure
                verse_matches = re.findall(r'VERSET \d+', content, re.IGNORECASE)
                biblical_text_matches = re.findall(r'TEXTE BIBLIQUE', content, re.IGNORECASE)
                theological_explanation_matches = re.findall(r'EXPLICATION THÉOLOGIQUE', content, re.IGNORECASE)
                
                print(f"📖 Verse sections found: {len(verse_matches)}")
                print(f"📜 Biblical text sections: {len(biblical_text_matches)}")
                print(f"🎓 Theological explanations: {len(theological_explanation_matches)}")
                
                # Show first 200 characters of content
                print(f"📄 Content preview: {content[:200]}...")
                
                # Determine success criteria
                success_criteria = {
                    "HTTP 200 response": response.status_code == 200,
                    "Content not empty": len(content) > 0,
                    "Reasonable response time": duration <= 30,
                    "French content": len(found_terms) >= 3,
                    "Theological structure": len(verse_matches) >= 1 and len(theological_explanation_matches) >= 1,
                    "Substantial content": len(content) >= 300
                }
                
                print("\n🔍 SUCCESS CRITERIA EVALUATION:")
                print("-" * 40)
                
                all_passed = True
                for criterion, passed in success_criteria.items():
                    status = "✅ PASS" if passed else "❌ FAIL"
                    print(f"{status} {criterion}")
                    if not passed:
                        all_passed = False
                
                if all_passed:
                    log_test("Review Request Test - /api/generate-verse-by-verse", "PASS", 
                            f"All criteria met. Content: {len(content)} chars, Time: {duration:.2f}s, Terms: {len(found_terms)}")
                    return True
                else:
                    log_test("Review Request Test - /api/generate-verse-by-verse", "FAIL", 
                            "Some success criteria not met")
                    return False
                    
            except json.JSONDecodeError as e:
                log_test("Review Request Test - /api/generate-verse-by-verse", "FAIL", 
                        f"Invalid JSON response: {e}")
                print(f"Raw response: {response.text[:500]}")
                return False
                
        else:
            log_test("Review Request Test - /api/generate-verse-by-verse", "FAIL", 
                    f"HTTP {response.status_code}: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        log_test("Review Request Test - /api/generate-verse-by-verse", "FAIL", 
                f"Request timeout after {TIMEOUT} seconds")
        return False
    except requests.exceptions.ConnectionError as e:
        log_test("Review Request Test - /api/generate-verse-by-verse", "FAIL", 
                f"Connection error: {e}")
        return False
    except Exception as e:
        log_test("Review Request Test - /api/generate-verse-by-verse", "FAIL", 
                f"Unexpected error: {e}")
        return False

def test_health_check():
    """Quick health check to verify backend is accessible"""
    try:
        response = requests.get(f"{BACKEND_URL}/api/health", timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            log_test("Health Check", "PASS", 
                    f"Backend accessible. Status: {data.get('status')}, Gemini: {data.get('gemini_enabled')}")
            return True
        else:
            log_test("Health Check", "FAIL", 
                    f"HTTP {response.status_code}: {response.text}")
            return False
    except Exception as e:
        log_test("Health Check", "FAIL", f"Error: {e}")
        return False

def main():
    """Run focused test for review request"""
    print("🔍 FOCUSED BACKEND TEST FOR REVIEW REQUEST")
    print("=" * 80)
    print("Context: User reports 'VERSETS PROG' button not working")
    print("Goal: Verify backend API is functioning correctly")
    print(f"Backend URL: {BACKEND_URL}")
    print("=" * 80)
    print()
    
    # Step 1: Health check
    print("STEP 1: Health Check")
    print("-" * 30)
    health_ok = test_health_check()
    
    if not health_ok:
        print("❌ Backend not accessible. Cannot proceed with API testing.")
        return False
    
    print()
    
    # Step 2: Test exact review request
    print("STEP 2: Test Exact Review Request Payload")
    print("-" * 30)
    api_ok = test_exact_review_request()
    
    print()
    print("=" * 80)
    print("FOCUSED TEST SUMMARY")
    print("=" * 80)
    
    if health_ok and api_ok:
        print("✅ BACKEND IS WORKING CORRECTLY")
        print("✅ /api/generate-verse-by-verse endpoint responds properly")
        print("✅ Content generation is functional")
        print("✅ French theological content is being generated")
        print()
        print("🔍 CONCLUSION: Backend API is not the issue.")
        print("   The problem with 'VERSETS PROG' button is likely in the frontend:")
        print("   - Check frontend JavaScript console for errors")
        print("   - Verify API call is being made from frontend")
        print("   - Check if response is being processed correctly")
        return True
    elif health_ok and not api_ok:
        print("⚠️  BACKEND ACCESSIBLE BUT API HAS ISSUES")
        print("❌ /api/generate-verse-by-verse endpoint has problems")
        print()
        print("🔍 CONCLUSION: Backend API issues found.")
        print("   This could explain why 'VERSETS PROG' button doesn't work.")
        return False
    else:
        print("❌ BACKEND NOT ACCESSIBLE")
        print("❌ Cannot reach the backend server")
        print()
        print("🔍 CONCLUSION: Backend connectivity issues.")
        print("   This explains why 'VERSETS PROG' button doesn't work.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)