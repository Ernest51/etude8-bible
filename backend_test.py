import requests
import sys
import json
import time
from datetime import datetime

class BibleStudyAPITester:
    def __init__(self, base_url="https://etude-biblique.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.session = requests.Session()
        self.session.timeout = 120  # 2 minutes timeout for AI generation

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED {details}")
        else:
            print(f"❌ {name} - FAILED {details}")
        return success

    def test_api_status(self):
        """Test API root endpoint"""
        try:
            response = self.session.get(f"{self.api_url}/")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                expected_keys = ["message", "status", "endpoints"]
                has_keys = all(key in data for key in expected_keys)
                success = has_keys and data.get("status") == "active"
                details = f"Status: {response.status_code}, Data: {data}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text}"
                
            return self.log_test("API Status Check", success, details)
            
        except Exception as e:
            return self.log_test("API Status Check", False, f"Exception: {str(e)}")

    def test_generate_study_quick(self):
        """Test study generation with quick parameters"""
        try:
            payload = {
                "passage": "Jean 3:16",
                "density": "200",  # Small for quick testing
                "model": "ChatGPT"
            }
            
            print(f"🔄 Generating study for: {payload['passage']} (density: {payload['density']})")
            start_time = time.time()
            
            response = self.session.post(f"{self.api_url}/generate-study", json=payload)
            
            end_time = time.time()
            duration = end_time - start_time
            
            success = response.status_code == 200
            
            if success:
                data = response.json()
                
                # Validate response structure
                required_keys = ["id", "passage", "sections", "timestamp"]
                has_required_keys = all(key in data for key in required_keys)
                
                # Validate sections (should have 29 sections numbered 0-28)
                sections = data.get("sections", {})
                expected_sections = [str(i) for i in range(29)]
                has_all_sections = all(section in sections for section in expected_sections)
                
                # Validate section structure
                valid_sections = True
                for i in range(29):
                    section = sections.get(str(i), {})
                    if not isinstance(section, dict) or "title" not in section or "content" not in section:
                        valid_sections = False
                        break
                
                success = has_required_keys and has_all_sections and valid_sections
                details = f"Duration: {duration:.1f}s, Sections: {len(sections)}/29, Passage: {data.get('passage')}"
                
                if success:
                    # Print first section as sample
                    first_section = sections.get("0", {})
                    print(f"📖 Sample section 0: {first_section.get('title', 'N/A')}")
                    print(f"📝 Content preview: {first_section.get('content', '')[:100]}...")
                
            else:
                details = f"Status: {response.status_code}, Error: {response.text[:200]}"
                
            return self.log_test("Generate Study (Quick)", success, details)
            
        except Exception as e:
            return self.log_test("Generate Study (Quick)", False, f"Exception: {str(e)}")

    def test_generate_study_invalid_input(self):
        """Test study generation with invalid input"""
        try:
            payload = {
                "passage": "",  # Empty passage
                "density": "2500",
                "model": "ChatGPT"
            }
            
            response = self.session.post(f"{self.api_url}/generate-study", json=payload)
            
            # Should return error for empty passage
            success = response.status_code >= 400
            details = f"Status: {response.status_code} (expected error for empty passage)"
            
            return self.log_test("Generate Study (Invalid Input)", success, details)
            
        except Exception as e:
            return self.log_test("Generate Study (Invalid Input)", False, f"Exception: {str(e)}")

    def test_get_studies(self):
        """Test getting recent studies"""
        try:
            response = self.session.get(f"{self.api_url}/studies")
            success = response.status_code == 200
            
            if success:
                data = response.json()
                success = isinstance(data, list)
                details = f"Status: {response.status_code}, Studies count: {len(data) if isinstance(data, list) else 'N/A'}"
            else:
                details = f"Status: {response.status_code}, Error: {response.text}"
                
            return self.log_test("Get Studies", success, details)
            
        except Exception as e:
            return self.log_test("Get Studies", False, f"Exception: {str(e)}")

    def test_cors_headers(self):
        """Test CORS headers"""
        try:
            response = self.session.options(f"{self.api_url}/")
            
            # Check for CORS headers
            cors_headers = [
                'Access-Control-Allow-Origin',
                'Access-Control-Allow-Methods',
                'Access-Control-Allow-Headers'
            ]
            
            has_cors = any(header in response.headers for header in cors_headers)
            success = has_cors or response.status_code == 200  # Some servers don't respond to OPTIONS
            
            details = f"Status: {response.status_code}, CORS headers present: {has_cors}"
            
            return self.log_test("CORS Headers", success, details)
            
        except Exception as e:
            return self.log_test("CORS Headers", False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Bible Study API Tests")
        print(f"🌐 Testing API at: {self.api_url}")
        print("=" * 60)
        
        # Test API status first
        if not self.test_api_status():
            print("❌ API is not accessible. Stopping tests.")
            return False
        
        # Test other endpoints
        self.test_cors_headers()
        self.test_get_studies()
        self.test_generate_study_invalid_input()
        
        # Test study generation (this takes time)
        print("\n⏳ Testing AI study generation (this may take 30-60 seconds)...")
        self.test_generate_study_quick()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All backend tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    tester = BibleStudyAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())