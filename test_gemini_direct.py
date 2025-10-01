#!/usr/bin/env python3
"""
Direct test of Gemini API to diagnose the issue
"""

import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

def test_gemini_key(key_name, api_key):
    """Test a specific Gemini API key"""
    if not api_key:
        print(f"❌ {key_name}: No API key found")
        return False
    
    try:
        print(f"🔑 Testing {key_name}: {api_key[:20]}...")
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        # Simple test prompt
        response = model.generate_content("Écris une phrase simple sur la Bible.")
        
        if response and response.text:
            print(f"✅ {key_name}: SUCCESS - {len(response.text)} chars")
            print(f"   Response: {response.text[:100]}...")
            return True
        else:
            print(f"❌ {key_name}: Empty response")
            return False
            
    except Exception as e:
        error_msg = str(e)
        print(f"❌ {key_name}: ERROR - {error_msg}")
        
        if "429" in error_msg or "quota" in error_msg.lower():
            print(f"   → Quota exceeded")
        elif "403" in error_msg or "forbidden" in error_msg.lower():
            print(f"   → Access forbidden")
        elif "401" in error_msg or "unauthorized" in error_msg.lower():
            print(f"   → Invalid API key")
        
        return False

def main():
    print("=" * 60)
    print("DIRECT GEMINI API KEY TESTING")
    print("=" * 60)
    
    # Test both keys
    key1 = os.getenv("GEMINI_API_KEY")
    key2 = os.getenv("GEMINI_API_KEY_2")
    
    results = []
    results.append(("GEMINI_API_KEY", test_gemini_key("GEMINI_API_KEY", key1)))
    results.append(("GEMINI_API_KEY_2", test_gemini_key("GEMINI_API_KEY_2", key2)))
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    working_keys = 0
    for key_name, success in results:
        status = "✅ WORKING" if success else "❌ FAILED"
        print(f"{status} - {key_name}")
        if success:
            working_keys += 1
    
    print(f"\nWorking keys: {working_keys}/2")
    
    if working_keys == 0:
        print("🚨 CRITICAL: No Gemini keys are working!")
        print("   → Backend will fallback to Bible API only")
    elif working_keys == 1:
        print("⚠️  WARNING: Only 1 Gemini key working")
        print("   → Limited capacity, may hit quotas quickly")
    else:
        print("🎉 SUCCESS: Both Gemini keys working")
        print("   → Full rotation system operational")

if __name__ == "__main__":
    main()