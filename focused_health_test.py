#!/usr/bin/env python3
"""
Focused Health Check Test for Bible Study API
As requested in the review: "Test de santé rapide du backend pour vérifier que les endpoints de base fonctionnent. 
Teste simplement l'endpoint /api/health pour confirmer que le backend répond correctement."
"""

import requests
import json
from datetime import datetime

# Configuration - Use the REACT_APP_BACKEND_URL from frontend/.env
BACKEND_URL = "https://rubriques-app.preview.emergentagent.com"
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
    """Test GET /api/health endpoint - specific test from review request"""
    try:
        print(f"Testing health endpoint: {BACKEND_URL}/api/health")
        response = requests.get(f"{BACKEND_URL}/api/health", timeout=TIMEOUT)
        
        print(f"Response status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"Response JSON: {json.dumps(data, indent=2)}")
                
                # Check for required fields based on actual API implementation
                if "status" in data and data["status"] == "ok":
                    log_test("GET /api/health - Health Check", "PASS", 
                            f"Status: {data.get('status')}, Gemini: {data.get('gemini_enabled')}, Message: {data.get('message', 'N/A')}")
                    return True
                else:
                    log_test("GET /api/health - Health Check", "FAIL", 
                            f"Status field missing or not 'ok'. Response: {data}")
                    return False
            except json.JSONDecodeError as e:
                log_test("GET /api/health - Health Check", "FAIL", 
                        f"Invalid JSON response: {e}. Raw response: {response.text}")
                return False
        else:
            log_test("GET /api/health - Health Check", "FAIL", 
                    f"HTTP Status: {response.status_code}, Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        log_test("GET /api/health - Health Check", "FAIL", f"Request timeout after {TIMEOUT} seconds")
        return False
    except requests.exceptions.ConnectionError as e:
        log_test("GET /api/health - Health Check", "FAIL", f"Connection error: {str(e)}")
        return False
    except Exception as e:
        log_test("GET /api/health - Health Check", "FAIL", f"Exception: {str(e)}")
        return False

def main():
    """Run the focused health check test"""
    print("=" * 80)
    print("FOCUSED HEALTH CHECK TEST - BIBLE STUDY API")
    print("Review Request: Test de santé rapide du backend")
    print("=" * 80)
    print(f"Testing backend at: {BACKEND_URL}")
    print(f"Timeout: {TIMEOUT} seconds")
    print()
    
    success = test_health_endpoint()
    
    print("=" * 80)
    print("HEALTH CHECK RESULT")
    print("=" * 80)
    
    if success:
        print("✅ HEALTH CHECK PASSED")
        print("✅ Backend is responding correctly")
        print("✅ /api/health endpoint is functional")
    else:
        print("❌ HEALTH CHECK FAILED")
        print("❌ Backend may have issues")
        print("❌ /api/health endpoint not working as expected")
    
    return success

if __name__ == "__main__":
    import sys
    success = main()
    sys.exit(0 if success else 1)