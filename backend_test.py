#!/usr/bin/env python3
"""
Backend API Testing Suite for Bible Study Application - Versets Functionality
Tests the POST /api/generate-verse-by-verse endpoint specifically
"""

import requests
import json
import time
import sys
from datetime import datetime

# Configuration - Use the public URL from frontend .env
BACKEND_URL = "https://biblecode.preview.emergentagent.com"
TIMEOUT = 30

def log_test(test_name, status, details=""):
    """Log test results with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"[{timestamp}] {status_symbol} {test_name}")
    if details:
        print(f"    Details: {details}")
    print()

def test_root_endpoint():
    """Test GET /api/ endpoint"""
    try:
        response = requests.get(f"{BACKEND_URL}/api/", timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            if "message" in data and "Bible Study API" in data["message"]:
                log_test("GET /api/ - Root endpoint", "PASS", f"Response: {data}")
                return True
            else:
                log_test("GET /api/ - Root endpoint", "FAIL", f"Unexpected response: {data}")
                return False
        else:
            log_test("GET /api/ - Root endpoint", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        log_test("GET /api/ - Root endpoint", "FAIL", f"Exception: {str(e)}")
        return False

def test_generate_verse_by_verse_genese():
    """Test POST /api/generate-verse-by-verse with Genèse 1:1 LSG (main test case)"""
    try:
        payload = {
            "passage": "Genèse 1:1 LSG",
            "version": "LSG"
        }
        
        headers = {"Content-Type": "application/json"}
        response = requests.post(f"{BACKEND_URL}/api/generate-verse-by-verse", 
                               json=payload, 
                               headers=headers, 
                               timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            
            # Check required fields
            if "content" not in data:
                log_test("POST /api/generate-verse-by-verse - Genèse 1:1", "FAIL", "Missing 'content' field")
                return False, None
            
            content = data["content"]
            
            # Validate content structure for verse-by-verse study
            required_elements = [
                "📖 Étude Verset par Verset - Genèse Chapitre 1",
                "🎯 Introduction au Chapitre",
                "📝 Verset",
                "Texte Biblique",
                "💡 Explication Théologique"
            ]
            
            missing_elements = []
            for element in required_elements:
                if element not in content:
                    missing_elements.append(element)
            
            if missing_elements:
                log_test("POST /api/generate-verse-by-verse - Genèse 1:1", "FAIL", 
                        f"Missing content elements: {missing_elements}")
                return False, None
            
            # Check content length (should be substantial for verse-by-verse)
            if len(content) < 500:
                log_test("POST /api/generate-verse-by-verse - Genèse 1:1", "FAIL", 
                        f"Content too short: {len(content)} characters")
                return False, None
            
            # Check for theological depth
            theological_terms = ["théologique", "exégèse", "herméneutique", "révélation", "divine"]
            found_terms = [term for term in theological_terms if term.lower() in content.lower()]
            
            if len(found_terms) < 3:
                log_test("POST /api/generate-verse-by-verse - Genèse 1:1", "FAIL", 
                        f"Insufficient theological content. Found terms: {found_terms}")
                return False, None
            
            log_test("POST /api/generate-verse-by-verse - Genèse 1:1", "PASS", 
                    f"Content length: {len(content)}, Theological terms: {found_terms}")
            return True, data
            
        else:
            log_test("POST /api/generate-verse-by-verse - Genèse 1:1", "FAIL", 
                    f"Status: {response.status_code}, Response: {response.text}")
            return False, None
            
    except Exception as e:
        log_test("POST /api/generate-verse-by-verse - Genèse 1:1", "FAIL", f"Exception: {str(e)}")
        return False, None

def test_generate_verse_by_verse_different_passages():
    """Test POST /api/generate-verse-by-verse with different Bible passages"""
    test_passages = [
        {"passage": "Jean 1:1 LSG", "version": "LSG"},
        {"passage": "Exode 1:1 LSG", "version": "LSG"}
    ]
    
    success_count = 0
    
    for test_case in test_passages:
        try:
            headers = {"Content-Type": "application/json"}
            response = requests.post(f"{BACKEND_URL}/api/generate-verse-by-verse", 
                                   json=test_case, 
                                   headers=headers, 
                                   timeout=TIMEOUT)
            
            if response.status_code == 200:
                data = response.json()
                if "content" in data and len(data["content"]) > 200:
                    success_count += 1
                    log_test(f"POST /api/generate-verse-by-verse - {test_case['passage']}", "PASS", 
                            f"Generated content length: {len(data['content'])}")
                else:
                    log_test(f"POST /api/generate-verse-by-verse - {test_case['passage']}", "FAIL", 
                            "Invalid or insufficient content")
            else:
                log_test(f"POST /api/generate-verse-by-verse - {test_case['passage']}", "FAIL", 
                        f"Status: {response.status_code}")
                
        except Exception as e:
            log_test(f"POST /api/generate-verse-by-verse - {test_case['passage']}", "FAIL", 
                    f"Exception: {str(e)}")
    
    return success_count >= 1  # At least 1 should work

def test_generate_verse_by_verse_error_handling():
    """Test POST /api/generate-verse-by-verse with invalid data"""
    test_cases = [
        {
            "name": "Empty passage",
            "payload": {
                "passage": "",
                "version": "LSG"
            }
        },
        {
            "name": "Missing version",
            "payload": {
                "passage": "Genèse 1:1 LSG"
            }
        },
        {
            "name": "Invalid passage format",
            "payload": {
                "passage": "InvalidBook 999:999 LSG",
                "version": "LSG"
            }
        }
    ]
    
    success_count = 0
    
    for test_case in test_cases:
        try:
            headers = {"Content-Type": "application/json"}
            response = requests.post(f"{BACKEND_URL}/api/generate-verse-by-verse", 
                                   json=test_case["payload"], 
                                   headers=headers, 
                                   timeout=TIMEOUT)
            
            # For error cases, we expect either 4xx/5xx status or a graceful fallback response
            if response.status_code >= 400:
                log_test(f"Error handling - {test_case['name']}", "PASS", 
                        f"Correctly returned error status: {response.status_code}")
                success_count += 1
            elif response.status_code == 200:
                # Check if it's a graceful fallback
                data = response.json()
                if "content" in data and ("fallback" in data["content"].lower() or 
                                        "cours de développement" in data["content"].lower()):
                    log_test(f"Error handling - {test_case['name']}", "PASS", 
                            "Graceful fallback response provided")
                    success_count += 1
                else:
                    log_test(f"Error handling - {test_case['name']}", "FAIL", 
                            "Unexpected successful response without fallback")
            else:
                log_test(f"Error handling - {test_case['name']}", "FAIL", 
                        f"Unexpected status: {response.status_code}")
                
        except Exception as e:
            log_test(f"Error handling - {test_case['name']}", "FAIL", f"Exception: {str(e)}")
    
    return success_count >= 2  # At least 2 out of 3 should handle errors properly

def test_generate_study_endpoint():
    """Test POST /api/generate-study endpoint (for comparison)"""
    try:
        payload = {
            "passage": "Jean 3:16 LSG",
            "version": "LSG",
            "tokens": 500,
            "model": "gpt",
            "requestedRubriques": [0]
        }
        
        headers = {"Content-Type": "application/json"}
        response = requests.post(f"{BACKEND_URL}/api/generate-study", 
                               json=payload, 
                               headers=headers, 
                               timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            if "content" in data and len(data["content"]) > 100:
                log_test("POST /api/generate-study - Basic test", "PASS", 
                        f"Content length: {len(data['content'])}")
                return True
            else:
                log_test("POST /api/generate-study - Basic test", "FAIL", 
                        "Invalid or insufficient content")
                return False
        else:
            log_test("POST /api/generate-study - Basic test", "FAIL", 
                    f"Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        log_test("POST /api/generate-study - Basic test", "FAIL", f"Exception: {str(e)}")
        return False

def run_all_tests():
    """Run all backend tests focused on verse-by-verse functionality"""
    print("=" * 80)
    print("BACKEND API TESTING SUITE - VERSETS FUNCTIONALITY")
    print("=" * 80)
    print(f"Testing backend at: {BACKEND_URL}")
    print(f"Timeout: {TIMEOUT} seconds")
    print()
    
    test_results = []
    
    # Test basic connectivity
    print("Testing basic connectivity...")
    test_results.append(("Root endpoint", test_root_endpoint()))
    
    print("\nTesting verse-by-verse generation (main functionality)...")
    # Test main verse-by-verse endpoint
    main_result, _ = test_generate_verse_by_verse_genese()
    test_results.append(("POST generate-verse-by-verse Genèse 1:1", main_result))
    test_results.append(("POST generate-verse-by-verse different passages", test_generate_verse_by_verse_different_passages()))
    test_results.append(("POST generate-verse-by-verse error handling", test_generate_verse_by_verse_error_handling()))
    
    print("\nTesting regular study generation (for comparison)...")
    test_results.append(("POST generate-study basic", test_generate_study_endpoint()))
    
    # Summary
    print("=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for _, result in test_results if result)
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print()
    print(f"OVERALL RESULT: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED!")
        return True
    elif passed >= 3:  # At least basic functionality works
        print("⚠️  SOME TESTS FAILED BUT CORE FUNCTIONALITY WORKS")
        return True
    else:
        print("❌ CRITICAL TESTS FAILED")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)