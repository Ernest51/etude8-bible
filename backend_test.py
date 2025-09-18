#!/usr/bin/env python3
"""
Backend API Testing Suite for Bible Study Application - Versets Functionality
Tests the POST /api/generate-verse-by-verse endpoint and related functionality
"""

import requests
import json
import time
import sys
from datetime import datetime

# Configuration - Use the public URL from frontend .env
BACKEND_URL = "http://localhost:8001/api"
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
        response = requests.get(f"{BACKEND_URL}/", timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            if "message" in data and data["message"] == "Bible Study API":
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

def test_books_endpoint():
    """Test GET /api/books endpoint"""
    try:
        response = requests.get(f"{BACKEND_URL}/books", timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            if "books" in data and isinstance(data["books"], dict):
                # Check for some expected books
                expected_books = ["Genèse", "Jean", "Psaumes", "Matthieu"]
                found_books = [book for book in expected_books if book in data["books"]]
                
                if len(found_books) >= 3:
                    log_test("GET /api/books - Books endpoint", "PASS", f"Found {len(data['books'])} books including: {found_books}")
                    return True
                else:
                    log_test("GET /api/books - Books endpoint", "FAIL", f"Missing expected books. Found: {list(data['books'].keys())[:5]}")
                    return False
            else:
                log_test("GET /api/books - Books endpoint", "FAIL", f"Invalid response format: {data}")
                return False
        else:
            log_test("GET /api/books - Books endpoint", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        log_test("GET /api/books - Books endpoint", "FAIL", f"Exception: {str(e)}")
        return False

def test_meditations_endpoint():
    """Test GET /api/meditations endpoint"""
    try:
        response = requests.get(f"{BACKEND_URL}/meditations", timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            if "meditations" in data and isinstance(data["meditations"], list):
                log_test("GET /api/meditations - Meditations endpoint", "PASS", f"Retrieved {len(data['meditations'])} meditations")
                return True
            else:
                log_test("GET /api/meditations - Meditations endpoint", "FAIL", f"Invalid response format: {data}")
                return False
        else:
            log_test("GET /api/meditations - Meditations endpoint", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        log_test("GET /api/meditations - Meditations endpoint", "FAIL", f"Exception: {str(e)}")
        return False

def test_generate_study_post_basic():
    """Test POST /api/generate-study with basic parameters"""
    try:
        payload = {
            "passage": "Jean 3:16",
            "version": "LSG",
            "tokens": 500,
            "model": "gpt",
            "requestedRubriques": [0, 1, 2]
        }
        
        headers = {"Content-Type": "application/json"}
        response = requests.post(f"{BACKEND_URL}/generate-study", 
                               json=payload, 
                               headers=headers, 
                               timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            
            # Check required fields
            required_fields = ["content", "reference"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                # Validate content
                if data["content"] and len(data["content"]) > 50:
                    # Validate reference
                    if data["reference"] == "Jean 3:16":
                        # Check optional sections
                        sections_valid = True
                        if "sections" in data and data["sections"]:
                            if not isinstance(data["sections"], list):
                                sections_valid = False
                        
                        if sections_valid:
                            log_test("POST /api/generate-study - Basic test", "PASS", 
                                   f"Content length: {len(data['content'])}, Reference: {data['reference']}, Sections: {len(data.get('sections', []))}")
                            return True, data
                        else:
                            log_test("POST /api/generate-study - Basic test", "FAIL", "Invalid sections format")
                            return False, None
                    else:
                        log_test("POST /api/generate-study - Basic test", "FAIL", f"Wrong reference: {data['reference']}")
                        return False, None
                else:
                    log_test("POST /api/generate-study - Basic test", "FAIL", f"Content too short or empty: {len(data.get('content', ''))}")
                    return False, None
            else:
                log_test("POST /api/generate-study - Basic test", "FAIL", f"Missing fields: {missing_fields}")
                return False, None
        else:
            log_test("POST /api/generate-study - Basic test", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
            return False, None
            
    except Exception as e:
        log_test("POST /api/generate-study - Basic test", "FAIL", f"Exception: {str(e)}")
        return False, None

def test_generate_study_post_different_passages():
    """Test POST /api/generate-study with different Bible passages"""
    test_passages = [
        "Psaumes 23:1",
        "Matthieu 5:3",
        "Romains 8:28"
    ]
    
    success_count = 0
    
    for passage in test_passages:
        try:
            payload = {
                "passage": passage,
                "version": "LSG",
                "tokens": 300,
                "model": "gpt",
                "requestedRubriques": [0, 1]
            }
            
            headers = {"Content-Type": "application/json"}
            response = requests.post(f"{BACKEND_URL}/generate-study", 
                                   json=payload, 
                                   headers=headers, 
                                   timeout=TIMEOUT)
            
            if response.status_code == 200:
                data = response.json()
                if "content" in data and "reference" in data and data["reference"] == passage:
                    success_count += 1
                    log_test(f"POST /api/generate-study - {passage}", "PASS", f"Generated content length: {len(data['content'])}")
                else:
                    log_test(f"POST /api/generate-study - {passage}", "FAIL", "Invalid response format")
            else:
                log_test(f"POST /api/generate-study - {passage}", "FAIL", f"Status: {response.status_code}")
                
        except Exception as e:
            log_test(f"POST /api/generate-study - {passage}", "FAIL", f"Exception: {str(e)}")
    
    return success_count == len(test_passages)

def test_generate_study_post_error_handling():
    """Test POST /api/generate-study with invalid data"""
    test_cases = [
        {
            "name": "Empty passage",
            "payload": {
                "passage": "",
                "version": "LSG",
                "tokens": 500,
                "model": "gpt",
                "requestedRubriques": [0, 1, 2]
            }
        },
        {
            "name": "Invalid tokens",
            "payload": {
                "passage": "Jean 3:16",
                "version": "LSG",
                "tokens": -100,
                "model": "gpt",
                "requestedRubriques": [0, 1, 2]
            }
        },
        {
            "name": "Missing required fields",
            "payload": {
                "version": "LSG",
                "tokens": 500
            }
        }
    ]
    
    success_count = 0
    
    for test_case in test_cases:
        try:
            headers = {"Content-Type": "application/json"}
            response = requests.post(f"{BACKEND_URL}/generate-study", 
                                   json=test_case["payload"], 
                                   headers=headers, 
                                   timeout=TIMEOUT)
            
            # For error cases, we expect either 4xx status or a graceful fallback response
            if response.status_code >= 400:
                log_test(f"Error handling - {test_case['name']}", "PASS", f"Correctly returned error status: {response.status_code}")
                success_count += 1
            elif response.status_code == 200:
                # Check if it's a graceful fallback
                data = response.json()
                if "content" in data and "error" not in data:
                    log_test(f"Error handling - {test_case['name']}", "PASS", "Graceful fallback response provided")
                    success_count += 1
                else:
                    log_test(f"Error handling - {test_case['name']}", "FAIL", "Unexpected successful response")
            else:
                log_test(f"Error handling - {test_case['name']}", "FAIL", f"Unexpected status: {response.status_code}")
                
        except Exception as e:
            log_test(f"Error handling - {test_case['name']}", "FAIL", f"Exception: {str(e)}")
    
    return success_count >= 2  # At least 2 out of 3 should handle errors properly

def test_database_persistence():
    """Test that meditations are saved to database"""
    try:
        # First, get current meditation count
        response_before = requests.get(f"{BACKEND_URL}/meditations", timeout=TIMEOUT)
        if response_before.status_code != 200:
            log_test("Database persistence - Get meditations before", "FAIL", "Could not fetch meditations")
            return False
        
        meditations_before = len(response_before.json().get("meditations", []))
        
        # Generate a new meditation
        payload = {
            "passage": "Jean 3:16",
            "version": "LSG",
            "tokens": 200,
            "model": "gpt",
            "requestedRubriques": [0]
        }
        
        headers = {"Content-Type": "application/json"}
        response = requests.post(f"{BACKEND_URL}/generate-study", 
                               json=payload, 
                               headers=headers, 
                               timeout=TIMEOUT)
        
        if response.status_code != 200:
            log_test("Database persistence - Generate meditation", "FAIL", f"Failed to generate meditation: {response.status_code}")
            return False
        
        # Wait a moment for database write
        time.sleep(2)
        
        # Check if meditation count increased
        response_after = requests.get(f"{BACKEND_URL}/meditations", timeout=TIMEOUT)
        if response_after.status_code != 200:
            log_test("Database persistence - Get meditations after", "FAIL", "Could not fetch meditations after generation")
            return False
        
        meditations_after = len(response_after.json().get("meditations", []))
        
        if meditations_after > meditations_before:
            log_test("Database persistence", "PASS", f"Meditation count increased from {meditations_before} to {meditations_after}")
            return True
        else:
            log_test("Database persistence", "FAIL", f"Meditation count did not increase: {meditations_before} -> {meditations_after}")
            return False
            
    except Exception as e:
        log_test("Database persistence", "FAIL", f"Exception: {str(e)}")
        return False

def run_all_tests():
    """Run all backend tests"""
    print("=" * 80)
    print("BACKEND API TESTING SUITE")
    print("=" * 80)
    print(f"Testing backend at: {BACKEND_URL}")
    print(f"Timeout: {TIMEOUT} seconds")
    print()
    
    test_results = []
    
    # Test existing endpoints
    print("Testing existing endpoints...")
    test_results.append(("Root endpoint", test_root_endpoint()))
    test_results.append(("Books endpoint", test_books_endpoint()))
    test_results.append(("Meditations endpoint", test_meditations_endpoint()))
    
    print("\nTesting new POST /api/generate-study endpoint...")
    # Test new POST endpoint
    basic_result, _ = test_generate_study_post_basic()
    test_results.append(("POST generate-study basic", basic_result))
    test_results.append(("POST generate-study different passages", test_generate_study_post_different_passages()))
    test_results.append(("POST generate-study error handling", test_generate_study_post_error_handling()))
    
    print("\nTesting database integration...")
    test_results.append(("Database persistence", test_database_persistence()))
    
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
    else:
        print("⚠️  SOME TESTS FAILED")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)