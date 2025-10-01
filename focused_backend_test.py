#!/usr/bin/env python3
"""
FOCUSED BACKEND TEST - Based on test_result.md current_focus
Tests only the specific tasks that need retesting according to test_result.md:
- Character Length Controls (failing)
- Single Verse Generation (failing) 
- Error Handling (failing)
"""

import requests
import json
import time
import sys
import re
from datetime import datetime

# Configuration
BACKEND_URL = "https://rubriques-app.preview.emergentagent.com"
TIMEOUT = 60

def log_test(test_name, status, details=""):
    """Log test results with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"[{timestamp}] {status_symbol} {test_name}")
    if details:
        print(f"    Details: {details}")
    print()

def test_character_length_controls():
    """Test character length controls - FAILING according to test_result.md"""
    print("🔍 Testing Character Length Controls (Current Focus)")
    
    test_cases = [
        {"tokens": 500, "expected_min": 300, "expected_max": 800},
        {"tokens": 1500, "expected_min": 800, "expected_max": 2000},
        {"tokens": 2500, "expected_min": 1500, "expected_max": 3500}
    ]
    
    results = []
    
    for test_case in test_cases:
        try:
            payload = {
                "passage": "Genèse 1",
                "tokens": test_case["tokens"],
                "use_gemini": True,
                "enriched": True
            }
            
            response = requests.post(f"{BACKEND_URL}/api/generate-verse-by-verse", 
                                   json=payload, 
                                   headers={"Content-Type": "application/json"}, 
                                   timeout=TIMEOUT)
            
            if response.status_code == 200:
                data = response.json()
                content = data.get("content", "")
                content_length = len(content)
                
                expected_range = f"{test_case['expected_min']}-{test_case['expected_max']}"
                
                if (content_length >= test_case["expected_min"] and 
                    content_length <= test_case["expected_max"]):
                    log_test(f"Length Control - {test_case['tokens']} tokens", "PASS", 
                            f"{content_length} chars (expected: {expected_range})")
                    results.append(True)
                else:
                    log_test(f"Length Control - {test_case['tokens']} tokens", "FAIL", 
                            f"{content_length} chars (expected: {expected_range}) - OUTSIDE RANGE")
                    results.append(False)
            else:
                log_test(f"Length Control - {test_case['tokens']} tokens", "FAIL", 
                        f"HTTP {response.status_code}")
                results.append(False)
                
        except Exception as e:
            log_test(f"Length Control - {test_case['tokens']} tokens", "FAIL", f"Exception: {str(e)}")
            results.append(False)
    
    success_count = sum(results)
    overall_success = success_count >= 2  # At least 2 out of 3 should work
    
    log_test("Character Length Controls", "PASS" if overall_success else "FAIL", 
            f"Working controls: {success_count}/3")
    
    return overall_success

def test_single_verse_generation():
    """Test single verse generation - FAILING according to test_result.md"""
    print("🔍 Testing Single Verse Generation (Current Focus)")
    
    try:
        payload = {
            "passage": "Genèse 1:1",
            "tokens": 500,
            "use_gemini": True,
            "enriched": True
        }
        
        response = requests.post(f"{BACKEND_URL}/api/generate-verse-by-verse", 
                               json=payload, 
                               headers={"Content-Type": "application/json"}, 
                               timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            content = data.get("content", "")
            
            # Check for single verse structure
            verse_matches = re.findall(r'VERSET \d+', content)
            explanation_matches = re.findall(r'EXPLICATION THÉOLOGIQUE', content)
            
            # Should have exactly 1 verse for single verse request
            if len(verse_matches) != 1:
                log_test("Single Verse Generation", "FAIL", 
                        f"Expected exactly 1 verse, found {len(verse_matches)} verses")
                return False
            
            if len(explanation_matches) != 1:
                log_test("Single Verse Generation", "FAIL", 
                        f"Expected exactly 1 theological explanation, found {len(explanation_matches)}")
                return False
            
            # Check for Genesis 1:1 specific content
            genesis_terms = ["commencement", "dieu", "créa", "cieux", "terre"]
            found_terms = [term for term in genesis_terms if term.lower() in content.lower()]
            
            if len(found_terms) < 3:
                log_test("Single Verse Generation", "FAIL", 
                        f"Insufficient Genesis 1:1 content. Found terms: {found_terms}")
                return False
            
            log_test("Single Verse Generation", "PASS", 
                    f"Single verse structure correct. Genesis terms: {found_terms}, Content: {len(content)} chars")
            return True
            
        else:
            log_test("Single Verse Generation", "FAIL", 
                    f"HTTP {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        log_test("Single Verse Generation", "FAIL", f"Exception: {str(e)}")
        return False

def test_error_handling():
    """Test error handling - FAILING according to test_result.md"""
    print("🔍 Testing Error Handling (Current Focus)")
    
    test_cases = [
        {
            "name": "Empty passage",
            "payload": {"passage": "", "tokens": 500},
            "expected_status": 400
        },
        {
            "name": "Invalid passage format", 
            "payload": {"passage": "InvalidBook 999:999", "tokens": 500},
            "expected_status": 400
        },
        {
            "name": "Missing passage field",
            "payload": {"tokens": 500},
            "expected_status": 400
        }
    ]
    
    results = []
    
    for test_case in test_cases:
        try:
            response = requests.post(f"{BACKEND_URL}/api/generate-verse-by-verse", 
                                   json=test_case["payload"], 
                                   headers={"Content-Type": "application/json"}, 
                                   timeout=TIMEOUT)
            
            if response.status_code == test_case["expected_status"]:
                log_test(f"Error Handling - {test_case['name']}", "PASS", 
                        f"Correctly returned HTTP {response.status_code}")
                results.append(True)
            else:
                log_test(f"Error Handling - {test_case['name']}", "FAIL", 
                        f"Expected HTTP {test_case['expected_status']}, got {response.status_code}")
                results.append(False)
                
        except Exception as e:
            log_test(f"Error Handling - {test_case['name']}", "FAIL", f"Exception: {str(e)}")
            results.append(False)
    
    success_count = sum(results)
    overall_success = success_count >= 2  # At least 2 out of 3 should work
    
    log_test("Error Handling", "PASS" if overall_success else "FAIL", 
            f"Working error cases: {success_count}/3")
    
    return overall_success

def test_health_check():
    """Quick health check to verify API is accessible"""
    try:
        response = requests.get(f"{BACKEND_URL}/api/health", timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "ok":
                log_test("Health Check", "PASS", 
                        f"API accessible. Gemini: {data.get('gemini_enabled')}")
                return True
        
        log_test("Health Check", "FAIL", f"HTTP {response.status_code}")
        return False
        
    except Exception as e:
        log_test("Health Check", "FAIL", f"Exception: {str(e)}")
        return False

def run_focused_tests():
    """Run focused tests based on test_result.md current_focus"""
    print("=" * 80)
    print("FOCUSED BACKEND TESTING - CURRENT FOCUS TASKS")
    print("=" * 80)
    print("Based on test_result.md current_focus:")
    print("- Character Length Controls (failing)")
    print("- Single Verse Generation (failing)")
    print("- Error Handling (failing)")
    print()
    print(f"Testing backend at: {BACKEND_URL}")
    print("=" * 80)
    
    # Quick health check first
    print("\n0. HEALTH CHECK")
    print("-" * 40)
    health_ok = test_health_check()
    
    if not health_ok:
        print("❌ API not accessible - aborting tests")
        return False
    
    test_results = []
    
    # Test 1: Character Length Controls
    print("\n1. CHARACTER LENGTH CONTROLS")
    print("-" * 40)
    test_results.append(("Character Length Controls", test_character_length_controls()))
    
    # Test 2: Single Verse Generation
    print("\n2. SINGLE VERSE GENERATION")
    print("-" * 40)
    test_results.append(("Single Verse Generation", test_single_verse_generation()))
    
    # Test 3: Error Handling
    print("\n3. ERROR HANDLING")
    print("-" * 40)
    test_results.append(("Error Handling", test_error_handling()))
    
    # Summary
    print("\n" + "=" * 80)
    print("FOCUSED TEST RESULTS SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for _, result in test_results if result)
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print()
    print(f"OVERALL RESULT: {passed}/{total} focused tests passed")
    
    if passed == total:
        print("\n🎉 ALL FOCUSED TESTS PASSED!")
        print("✅ Current focus issues have been resolved")
        return True
    else:
        print(f"\n❌ {total - passed} FOCUSED TESTS STILL FAILING")
        print("❌ Current focus issues persist")
        return False

if __name__ == "__main__":
    success = run_focused_tests()
    sys.exit(0 if success else 1)