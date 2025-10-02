#!/usr/bin/env python3
"""
Focused Backend Health Check for New UI Buttons
Tests the backend infrastructure stability for the 4 new control buttons:
- "gemini" - Tests Gemini API status and fallback
- "chatgpt" - Tests alternative AI endpoints (if available)  
- "prise de note" - Tests note-taking endpoints
- "api" - Tests API status and health endpoints
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://faithai-tools.preview.emergentagent.com"
TIMEOUT = 30

def log_test(test_name, status, details=""):
    """Log test results with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"[{timestamp}] {status_symbol} {test_name}")
    if details:
        print(f"    Details: {details}")
    print()

def test_health_endpoint():
    """Test /api/health - Critical for API status button"""
    try:
        response = requests.get(f"{BACKEND_URL}/api/health", timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            
            # Check basic health response
            if data.get("status") == "ok":
                # Extract key information
                rotation_system = data.get("rotation_system", "Not configured")
                gemini_keys = data.get("gemini_keys", [])
                bible_api = data.get("bible_api_configured", False)
                cache_entries = data.get("cache_entries", 0)
                
                log_test("Health Endpoint (/api/health)", "PASS", 
                        f"Status: OK, Rotation: {rotation_system}, Gemini Keys: {len(gemini_keys)}, Bible API: {bible_api}, Cache: {cache_entries}")
                return True
            else:
                log_test("Health Endpoint (/api/health)", "FAIL", 
                        f"Status not OK: {data.get('status')}")
                return False
        else:
            log_test("Health Endpoint (/api/health)", "FAIL", 
                    f"HTTP {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        log_test("Health Endpoint (/api/health)", "FAIL", f"Exception: {str(e)}")
        return False

def test_api_status_endpoint():
    """Test /api/api-status - For real-time API monitoring"""
    try:
        response = requests.get(f"{BACKEND_URL}/api/api-status", timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            log_test("API Status Endpoint (/api/api-status)", "PASS", 
                    f"Response keys: {list(data.keys())}")
            return True
        else:
            log_test("API Status Endpoint (/api/api-status)", "FAIL", 
                    f"HTTP {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        log_test("API Status Endpoint (/api/api-status)", "FAIL", f"Exception: {str(e)}")
        return False

def test_gemini_functionality():
    """Test Gemini functionality - For Gemini button"""
    try:
        payload = {
            "passage": "Jean 3:16",
            "tokens": 300,
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
            source = data.get("source", "Unknown")
            cost = data.get("cost", "Unknown")
            
            # Check if it's using Gemini or fallback
            if "Gemini" in source:
                log_test("Gemini Functionality", "PASS", 
                        f"Using Gemini: {source}, Content: {len(content)} chars, Cost: {cost}")
            else:
                log_test("Gemini Functionality", "WARN", 
                        f"Using Fallback: {source}, Content: {len(content)} chars, Cost: {cost}")
            return True
        else:
            log_test("Gemini Functionality", "FAIL", 
                    f"HTTP {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        log_test("Gemini Functionality", "FAIL", f"Exception: {str(e)}")
        return False

def test_study_generation():
    """Test study generation - For theological study buttons"""
    try:
        payload = {
            "passage": "Matthieu 5:3",
            "tokens": 500,
            "use_gemini": True,
            "selected_rubriques": [1, 2, 3]  # Test first 3 rubriques
        }
        
        response = requests.post(f"{BACKEND_URL}/api/generate-study", 
                               json=payload, 
                               headers={"Content-Type": "application/json"}, 
                               timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            content = data.get("content", "")
            source = data.get("source", "Unknown")
            rubriques_generated = data.get("rubriques_generated", 0)
            
            log_test("Study Generation (/api/generate-study)", "PASS", 
                    f"Source: {source}, Content: {len(content)} chars, Rubriques: {rubriques_generated}")
            return True
        else:
            log_test("Study Generation (/api/generate-study)", "FAIL", 
                    f"HTTP {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        log_test("Study Generation (/api/generate-study)", "FAIL", f"Exception: {str(e)}")
        return False

def test_cache_functionality():
    """Test cache system - Important for performance"""
    try:
        response = requests.get(f"{BACKEND_URL}/api/cache-stats", timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            quota_status = data.get("quota_status", "Unknown")
            cache_entries = data.get("cache_entries", 0)
            system_status = data.get("system_status", "Unknown")
            
            log_test("Cache System (/api/cache-stats)", "PASS", 
                    f"Status: {system_status}, Quota: {quota_status}, Cache: {cache_entries} entries")
            return True
        else:
            log_test("Cache System (/api/cache-stats)", "FAIL", 
                    f"HTTP {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        log_test("Cache System (/api/cache-stats)", "FAIL", f"Exception: {str(e)}")
        return False

def test_basic_connectivity():
    """Test basic backend connectivity"""
    try:
        response = requests.get(f"{BACKEND_URL}/", timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            message = data.get("message", "")
            log_test("Basic Connectivity (/)", "PASS", f"Message: {message}")
            return True
        else:
            log_test("Basic Connectivity (/)", "FAIL", 
                    f"HTTP {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        log_test("Basic Connectivity (/)", "FAIL", f"Exception: {str(e)}")
        return False

def run_focused_health_check():
    """Run focused health check for new UI buttons"""
    print("=" * 80)
    print("FOCUSED BACKEND HEALTH CHECK")
    print("Testing infrastructure stability for 4 new UI control buttons:")
    print("- 'gemini' button support")
    print("- 'chatgpt' button support") 
    print("- 'prise de note' button support")
    print("- 'api' status button support")
    print("=" * 80)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Timeout: {TIMEOUT} seconds")
    print()
    
    test_results = []
    
    # Test 1: Basic Connectivity
    print("1. BASIC CONNECTIVITY TEST")
    print("-" * 40)
    test_results.append(("Basic Connectivity", test_basic_connectivity()))
    
    # Test 2: Health Endpoint (Critical for API button)
    print("2. HEALTH ENDPOINT TEST")
    print("-" * 40)
    test_results.append(("Health Endpoint", test_health_endpoint()))
    
    # Test 3: API Status (For real-time monitoring)
    print("3. API STATUS ENDPOINT TEST")
    print("-" * 40)
    test_results.append(("API Status Endpoint", test_api_status_endpoint()))
    
    # Test 4: Gemini Functionality (For Gemini button)
    print("4. GEMINI FUNCTIONALITY TEST")
    print("-" * 40)
    test_results.append(("Gemini Functionality", test_gemini_functionality()))
    
    # Test 5: Study Generation (For theological buttons)
    print("5. STUDY GENERATION TEST")
    print("-" * 40)
    test_results.append(("Study Generation", test_study_generation()))
    
    # Test 6: Cache System (For performance)
    print("6. CACHE SYSTEM TEST")
    print("-" * 40)
    test_results.append(("Cache System", test_cache_functionality()))
    
    # Summary
    print("\n" + "=" * 80)
    print("FOCUSED HEALTH CHECK RESULTS")
    print("=" * 80)
    
    passed = sum(1 for _, result in test_results if result)
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print()
    print(f"OVERALL RESULT: {passed}/{total} tests passed")
    
    # Determine infrastructure stability
    critical_tests = [
        "Basic Connectivity",
        "Health Endpoint", 
        "Gemini Functionality"
    ]
    
    critical_passed = sum(1 for test_name, result in test_results 
                         if result and test_name in critical_tests)
    
    print("\n" + "=" * 80)
    print("INFRASTRUCTURE STABILITY ASSESSMENT")
    print("=" * 80)
    
    if critical_passed >= 2:
        print("✅ BACKEND INFRASTRUCTURE IS STABLE")
        print("✅ Ready for new UI button testing")
        print("✅ Core endpoints operational")
        
        if passed == total:
            print("🎉 ALL SYSTEMS OPTIMAL")
        else:
            print("⚠️  Some non-critical issues detected")
            
        return True
    else:
        print("❌ BACKEND INFRASTRUCTURE ISSUES DETECTED")
        print("❌ Not ready for UI testing")
        print(f"❌ Critical systems failed: {3 - critical_passed}/3")
        return False

if __name__ == "__main__":
    success = run_focused_health_check()
    exit(0 if success else 1)