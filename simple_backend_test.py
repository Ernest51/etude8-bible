#!/usr/bin/env python3
import requests
import json

def test_backend():
    base_url = "https://etude-biblique.preview.emergentagent.com/api"
    
    print("🚀 Bible Study API Quick Test")
    print("=" * 50)
    
    # Test 1: API Status
    try:
        response = requests.get(f"{base_url}/", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print("✅ API Status: ACTIVE")
            print(f"   Message: {data.get('message')}")
            print(f"   Status: {data.get('status')}")
            print(f"   Endpoints: {data.get('endpoints')}")
        else:
            print(f"❌ API Status: ERROR {response.status_code}")
    except Exception as e:
        print(f"❌ API Status: FAILED - {str(e)}")
    
    # Test 2: Get Studies
    try:
        response = requests.get(f"{base_url}/studies", timeout=10)
        if response.status_code == 200:
            studies = response.json()
            print(f"✅ Get Studies: SUCCESS - Found {len(studies)} studies")
            if studies:
                latest = studies[0]
                print(f"   Latest study: {latest.get('passage', 'N/A')}")
        else:
            print(f"❌ Get Studies: ERROR {response.status_code}")
    except Exception as e:
        print(f"❌ Get Studies: FAILED - {str(e)}")
    
    # Test 3: Generate Study (quick test)
    print("\n⏳ Testing study generation (may take 30-60 seconds)...")
    try:
        payload = {
            "passage": "Jean 3:16",
            "density": "200",  # Small for quick test
            "model": "ChatGPT"
        }
        
        response = requests.post(f"{base_url}/generate-study", 
                               json=payload, 
                               timeout=90)
        
        if response.status_code == 200:
            data = response.json()
            sections = data.get('sections', {})
            print(f"✅ Generate Study: SUCCESS")
            print(f"   Passage: {data.get('passage')}")
            print(f"   Sections: {len(sections)}/29")
            print(f"   Study ID: {data.get('id')}")
            
            # Validate sections
            if len(sections) == 29:
                print("✅ All 29 sections generated")
            else:
                print(f"⚠️  Only {len(sections)} sections generated")
                
        else:
            error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
            print(f"❌ Generate Study: ERROR {response.status_code}")
            print(f"   Error: {error_data}")
            
    except requests.exceptions.Timeout:
        print("❌ Generate Study: TIMEOUT (>90 seconds)")
    except Exception as e:
        print(f"❌ Generate Study: FAILED - {str(e)}")
    
    print("\n" + "=" * 50)
    print("🏁 Backend test completed")

if __name__ == "__main__":
    test_backend()