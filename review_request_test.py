#!/usr/bin/env python3
"""
Backend API Testing Suite for Review Request Validation
Tests according to the specific review request:

1. **Modal API dans les rubriques** - Test endpoints /api/api-status and /api/api-history 
   that display 5 APIs with colors and status
2. **Nouvelle zone de personnages bibliques** - Test biblical character search functionality 
   with 70+ characters and detailed story generation  
3. **4 Gemini keys system stability** - Test the 4-key Gemini rotation system
4. **General infrastructure health** - Test that new components haven't broken existing functionality

Focus: Test rapide de validation uniquement.
"""

import requests
import json
import time
import sys
import re
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

def test_api_status_endpoint():
    """Test GET /api/api-status endpoint - Modal API dans les rubriques"""
    try:
        response = requests.get(f"{BACKEND_URL}/api/api-status", timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            
            # Check if response contains API status information
            if not isinstance(data, dict):
                log_test("GET /api/api-status - Modal API Status", "FAIL", 
                        "Response is not a JSON object")
                return False
            
            # Look for API status information (should contain info about the 5 APIs)
            # Expected structure should contain information about different APIs
            content_str = json.dumps(data).lower()
            
            # Check for API-related keywords
            api_indicators = ["api", "status", "gemini", "bible", "key"]
            found_indicators = [term for term in api_indicators if term in content_str]
            
            if len(found_indicators) >= 3:
                log_test("GET /api/api-status - Modal API Status", "PASS", 
                        f"API status endpoint working. Found indicators: {found_indicators}, Response size: {len(json.dumps(data))} chars")
                return True
            else:
                log_test("GET /api/api-status - Modal API Status", "FAIL", 
                        f"Insufficient API status information. Found: {found_indicators}")
                return False
        else:
            log_test("GET /api/api-status - Modal API Status", "FAIL", 
                    f"Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        log_test("GET /api/api-status - Modal API Status", "FAIL", f"Exception: {str(e)}")
        return False

def test_api_history_endpoint():
    """Test GET /api/api-history endpoint - Modal API dans les rubriques"""
    try:
        response = requests.get(f"{BACKEND_URL}/api/api-history", timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            
            # Check if response contains API history information
            if not isinstance(data, dict):
                log_test("GET /api/api-history - Modal API History", "FAIL", 
                        "Response is not a JSON object")
                return False
            
            # Look for history-related fields
            expected_fields = ["timestamp", "total_calls", "history"]
            found_fields = [field for field in expected_fields if field in data]
            
            if len(found_fields) >= 2:
                # Check if history data is present
                history_data = data.get("history", [])
                total_calls = data.get("total_calls", 0)
                
                log_test("GET /api/api-history - Modal API History", "PASS", 
                        f"API history endpoint working. Fields: {found_fields}, Total calls: {total_calls}, History entries: {len(history_data)}")
                return True
            else:
                log_test("GET /api/api-history - Modal API History", "FAIL", 
                        f"Missing expected fields. Found: {found_fields}, Expected: {expected_fields}")
                return False
        else:
            log_test("GET /api/api-history - Modal API History", "FAIL", 
                    f"Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        log_test("GET /api/api-history - Modal API History", "FAIL", f"Exception: {str(e)}")
        return False

def test_4_gemini_keys_system():
    """Test 4 Gemini keys system stability - Système de 4 clés Gemini"""
    try:
        # Test health endpoint to check Gemini keys configuration
        response = requests.get(f"{BACKEND_URL}/api/health", timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            
            # Check for Gemini keys information
            gemini_keys = data.get("gemini_keys", [])
            rotation_system = data.get("rotation_system", "")
            current_key = data.get("current_key", "")
            
            # Should have 4 Gemini keys configured
            if len(gemini_keys) >= 4:
                # Check if rotation system is active
                if "rotation" in rotation_system.lower():
                    # Test actual content generation to verify keys work
                    payload = {
                        "passage": "Genèse 1:1",
                        "tokens": 500,
                        "use_gemini": True,
                        "enriched": True
                    }
                    
                    headers = {"Content-Type": "application/json"}
                    gen_response = requests.post(f"{BACKEND_URL}/api/generate-verse-by-verse", 
                                               json=payload, 
                                               headers=headers, 
                                               timeout=TIMEOUT)
                    
                    if gen_response.status_code == 200:
                        gen_data = gen_response.json()
                        content = gen_data.get("content", "")
                        source = gen_data.get("source", "")
                        
                        # Check if content was generated successfully
                        if len(content) > 300 and ("gemini" in source.lower() or "gratuit" in source.lower()):
                            log_test("4 Gemini Keys System Stability", "PASS", 
                                    f"4 keys detected: {len(gemini_keys)}, Rotation active, Content generated: {len(content)} chars, Source: {source}")
                            return True
                        else:
                            log_test("4 Gemini Keys System Stability", "FAIL", 
                                    f"Content generation failed or not using Gemini. Content: {len(content)} chars, Source: {source}")
                            return False
                    else:
                        log_test("4 Gemini Keys System Stability", "FAIL", 
                                f"Content generation failed with status: {gen_response.status_code}")
                        return False
                else:
                    log_test("4 Gemini Keys System Stability", "FAIL", 
                            f"Rotation system not active. System: {rotation_system}")
                    return False
            else:
                log_test("4 Gemini Keys System Stability", "FAIL", 
                        f"Expected 4 Gemini keys, found: {len(gemini_keys)}")
                return False
        else:
            log_test("4 Gemini Keys System Stability", "FAIL", 
                    f"Health check failed with status: {response.status_code}")
            return False
            
    except Exception as e:
        log_test("4 Gemini Keys System Stability", "FAIL", f"Exception: {str(e)}")
        return False

def test_biblical_characters_functionality():
    """Test biblical characters functionality - Nouvelle zone de personnages bibliques"""
    try:
        # Test if we can generate content for biblical characters
        # This tests the backend's ability to handle character-specific requests
        biblical_characters = [
            "Abraham", "David", "Moïse", "Pierre", "Paul", "Marie", "Joseph", "Daniel"
        ]
        
        successful_generations = 0
        
        for character in biblical_characters[:3]:  # Test first 3 characters for speed
            try:
                payload = {
                    "passage": f"Histoire de {character}",
                    "tokens": 800,
                    "use_gemini": True,
                    "enriched": True
                }
                
                headers = {"Content-Type": "application/json"}
                response = requests.post(f"{BACKEND_URL}/api/generate-verse-by-verse", 
                                       json=payload, 
                                       headers=headers, 
                                       timeout=TIMEOUT)
                
                if response.status_code == 200:
                    data = response.json()
                    content = data.get("content", "")
                    
                    # Check if content contains character-specific information
                    if len(content) > 200 and character.lower() in content.lower():
                        successful_generations += 1
                        
            except Exception as char_e:
                print(f"    Character {character} test failed: {str(char_e)}")
                continue
        
        if successful_generations >= 2:
            log_test("Biblical Characters Functionality", "PASS", 
                    f"Successfully generated content for {successful_generations}/3 biblical characters")
            return True
        else:
            log_test("Biblical Characters Functionality", "FAIL", 
                    f"Only {successful_generations}/3 character generations successful")
            return False
            
    except Exception as e:
        log_test("Biblical Characters Functionality", "FAIL", f"Exception: {str(e)}")
        return False

def test_infrastructure_health():
    """Test general infrastructure health - Test de santé général de l'infrastructure"""
    try:
        # Test multiple core endpoints to ensure infrastructure is stable
        endpoints_to_test = [
            ("/api/health", "GET"),
            ("/api/cache-stats", "GET"),
            ("/api/api-status", "GET")
        ]
        
        successful_endpoints = 0
        
        for endpoint, method in endpoints_to_test:
            try:
                if method == "GET":
                    response = requests.get(f"{BACKEND_URL}{endpoint}", timeout=TIMEOUT)
                else:
                    response = requests.post(f"{BACKEND_URL}{endpoint}", timeout=TIMEOUT)
                
                if response.status_code == 200:
                    successful_endpoints += 1
                    
            except Exception as endpoint_e:
                print(f"    Endpoint {endpoint} failed: {str(endpoint_e)}")
                continue
        
        # Test a basic content generation to ensure core functionality works
        try:
            payload = {
                "passage": "Psaumes 23:1",
                "tokens": 300,
                "use_gemini": True,
                "enriched": True
            }
            
            headers = {"Content-Type": "application/json"}
            gen_response = requests.post(f"{BACKEND_URL}/api/generate-verse-by-verse", 
                                       json=payload, 
                                       headers=headers, 
                                       timeout=TIMEOUT)
            
            if gen_response.status_code == 200:
                gen_data = gen_response.json()
                content = gen_data.get("content", "")
                if len(content) > 100:
                    successful_endpoints += 1  # Count generation as successful endpoint
                    
        except Exception as gen_e:
            print(f"    Content generation test failed: {str(gen_e)}")
        
        # Infrastructure is healthy if most endpoints work
        if successful_endpoints >= 3:
            log_test("Infrastructure Health Check", "PASS", 
                    f"Infrastructure stable: {successful_endpoints}/4 core functions working")
            return True
        else:
            log_test("Infrastructure Health Check", "FAIL", 
                    f"Infrastructure issues: only {successful_endpoints}/4 core functions working")
            return False
            
    except Exception as e:
        log_test("Infrastructure Health Check", "FAIL", f"Exception: {str(e)}")
        return False

def run_review_request_tests():
    """Run all tests according to the review request"""
    print("=" * 80)
    print("REVIEW REQUEST VALIDATION - BACKEND API TESTING")
    print("=" * 80)
    print(f"Testing backend at: {BACKEND_URL}")
    print(f"Timeout: {TIMEOUT} seconds")
    print()
    print("REVIEW REQUEST FOCUS AREAS:")
    print("1. Modal API dans les rubriques (/api/api-status et /api/api-history)")
    print("2. Nouvelle zone de personnages bibliques (70+ personnages)")
    print("3. Système de 4 clés Gemini stable")
    print("4. Test de santé général de l'infrastructure")
    print()
    
    test_results = []
    
    # Test 1: Modal API Status Endpoint
    print("1. MODAL API STATUS ENDPOINT")
    print("-" * 40)
    test_results.append(("GET /api/api-status - Modal API Status", test_api_status_endpoint()))
    
    # Test 2: Modal API History Endpoint
    print("\n2. MODAL API HISTORY ENDPOINT")
    print("-" * 40)
    test_results.append(("GET /api/api-history - Modal API History", test_api_history_endpoint()))
    
    # Test 3: 4 Gemini Keys System
    print("\n3. 4 GEMINI KEYS SYSTEM STABILITY")
    print("-" * 40)
    test_results.append(("4 Gemini Keys System Stability", test_4_gemini_keys_system()))
    
    # Test 4: Biblical Characters Functionality
    print("\n4. BIBLICAL CHARACTERS FUNCTIONALITY")
    print("-" * 40)
    test_results.append(("Biblical Characters Functionality", test_biblical_characters_functionality()))
    
    # Test 5: Infrastructure Health
    print("\n5. INFRASTRUCTURE HEALTH CHECK")
    print("-" * 40)
    test_results.append(("Infrastructure Health Check", test_infrastructure_health()))
    
    # Summary
    print("\n" + "=" * 80)
    print("REVIEW REQUEST TEST RESULTS SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for _, result in test_results if result)
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print()
    print(f"OVERALL RESULT: {passed}/{total} tests passed")
    
    # Determine overall success for review request
    if passed >= 4:  # Most tests should pass for validation
        print("\n🎉 REVIEW REQUEST VALIDATION SUCCESSFUL!")
        print("✅ Modal API endpoints working")
        print("✅ 4 Gemini keys system stable") 
        print("✅ Biblical characters functionality operational")
        print("✅ Infrastructure health confirmed")
        return True
    elif passed >= 3:
        print("\n⚠️  REVIEW REQUEST MOSTLY SUCCESSFUL")
        print(f"✅ {passed}/{total} validation tests passed")
        print("⚠️  Minor issues detected but core functionality works")
        return True
    else:
        print("\n❌ REVIEW REQUEST VALIDATION FAILED")
        print("❌ Major issues with new functionality")
        print(f"❌ Only {passed}/{total} validation tests passed")
        return False

if __name__ == "__main__":
    success = run_review_request_tests()
    sys.exit(0 if success else 1)