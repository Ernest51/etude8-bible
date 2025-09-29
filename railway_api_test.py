#!/usr/bin/env python3
"""
CRITICAL RAILWAY API TEST - DIAGNOSTIC FOR GENERIC CONTENT ISSUE

This test specifically addresses the user's report that "verset par verset" displays generic content:
- "Texte du verset 1 (Genèse 1:1)" instead of real biblical text
- Empty or generic "EXPLICATION THÉOLOGIQUE" sections

TESTS REQUIRED:
1. Direct test of Railway API: https://etude8-bible-api-production.up.railway.app/api/generate-verse-by-verse
2. Verify if API returns real biblical text for Genesis 1:1 ("Au commencement, Dieu créa les cieux et la terre")
3. Check if theological explanations are substantial or generic
4. Measure content length
5. Compare with local API if possible

OBJECTIVE: Determine if the problem comes from Railway API returning generic content,
or if it's a frontend processing issue.
"""

import requests
import json
import time
import sys
import re
from datetime import datetime

# Railway API Configuration
RAILWAY_API_URL = "https://etude8-bible-api-production.up.railway.app"
LOCAL_API_URL = "https://dual-study-bible.preview.emergentagent.com"
TIMEOUT = 120

def log_test(test_name, status, details=""):
    """Log test results with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"[{timestamp}] {status_symbol} {test_name}")
    if details:
        print(f"    Details: {details}")
    print()

def test_railway_api_direct():
    """
    CRITICAL TEST: Direct test of Railway API with exact parameters from review request
    curl -X POST https://etude8-bible-api-production.up.railway.app/api/generate-verse-by-verse \
    -H "Content-Type: application/json" \
    -d '{"passage": "Genèse 1", "version": "LSG", "tokens": 500, "use_gemini": true, "enriched": true}'
    """
    try:
        payload = {
            "passage": "Genèse 1",
            "version": "LSG",
            "tokens": 500,
            "use_gemini": True,
            "enriched": True
        }
        
        headers = {"Content-Type": "application/json"}
        
        print(f"🚀 Testing Railway API directly: {RAILWAY_API_URL}/api/generate-verse-by-verse")
        print(f"📋 Payload: {json.dumps(payload, indent=2)}")
        
        start_time = time.time()
        response = requests.post(f"{RAILWAY_API_URL}/api/generate-verse-by-verse", 
                               json=payload, 
                               headers=headers, 
                               timeout=TIMEOUT)
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"⏱️  Response time: {duration:.2f} seconds")
        print(f"📊 Status code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            content = data.get("content", "")
            content_length = len(content)
            
            print(f"📏 Content length: {content_length} characters")
            
            # CRITICAL CHECK 1: Does it contain real Genesis 1:1 text?
            genesis_1_1_text = "au commencement dieu créa les cieux et la terre"
            genesis_1_1_variations = [
                "au commencement, dieu créa les cieux et la terre",
                "au commencement dieu créa les cieux et la terre",
                "commencement dieu créa cieux terre"
            ]
            
            has_real_genesis_text = any(variation in content.lower() for variation in genesis_1_1_variations)
            
            # CRITICAL CHECK 2: Does it contain generic placeholder text?
            generic_indicators = [
                "texte du verset 1 (genèse 1:1)",
                "texte du verset",
                "contenu générique",
                "placeholder",
                "lorem ipsum"
            ]
            
            has_generic_content = any(indicator in content.lower() for indicator in generic_indicators)
            
            # CRITICAL CHECK 3: Are theological explanations substantial?
            theological_sections = re.findall(r'EXPLICATION THÉOLOGIQUE.*?(?=\*\*|$)', content, re.DOTALL | re.IGNORECASE)
            substantial_explanations = 0
            
            for section in theological_sections:
                # Remove formatting and count meaningful words
                clean_section = re.sub(r'\*\*.*?\*\*', '', section)
                clean_section = re.sub(r'[^\w\s]', ' ', clean_section)
                words = [word for word in clean_section.split() if len(word) > 3]
                
                if len(words) > 20:  # At least 20 meaningful words
                    substantial_explanations += 1
            
            # CRITICAL CHECK 4: Theological quality indicators
            theological_terms = [
                "création", "créateur", "commencement", "dieu", "théologique",
                "spirituel", "divin", "biblique", "révélation", "souverain",
                "omnipotent", "éternel", "trinité", "incarnation"
            ]
            found_theological_terms = [term for term in theological_terms if term.lower() in content.lower()]
            
            # ANALYSIS RESULTS
            print("\n🔍 CRITICAL ANALYSIS RESULTS:")
            print(f"   ✅ Real Genesis 1:1 text found: {'YES' if has_real_genesis_text else 'NO'}")
            print(f"   ❌ Generic placeholder content: {'YES' if has_generic_content else 'NO'}")
            print(f"   📚 Substantial theological explanations: {substantial_explanations}")
            print(f"   🎓 Theological terms found: {len(found_theological_terms)} ({found_theological_terms[:5]})")
            
            # Show first 500 characters for manual inspection
            print(f"\n📖 CONTENT PREVIEW (first 500 chars):")
            print("-" * 60)
            print(content[:500])
            print("-" * 60)
            
            # VERDICT
            if has_real_genesis_text and not has_generic_content and substantial_explanations > 0:
                log_test("Railway API Direct Test - Content Quality", "PASS", 
                        f"Real biblical text found, {substantial_explanations} substantial explanations, {len(found_theological_terms)} theological terms")
                return True, content
            elif has_generic_content:
                log_test("Railway API Direct Test - Content Quality", "FAIL", 
                        f"GENERIC CONTENT DETECTED - This confirms the user's report of placeholder text")
                return False, content
            elif not has_real_genesis_text:
                log_test("Railway API Direct Test - Content Quality", "FAIL", 
                        f"MISSING REAL BIBLICAL TEXT - Genesis 1:1 text not found in response")
                return False, content
            else:
                log_test("Railway API Direct Test - Content Quality", "FAIL", 
                        f"INSUFFICIENT THEOLOGICAL CONTENT - Only {substantial_explanations} substantial explanations")
                return False, content
                
        else:
            log_test("Railway API Direct Test", "FAIL", 
                    f"HTTP {response.status_code}: {response.text}")
            return False, ""
            
    except Exception as e:
        log_test("Railway API Direct Test", "FAIL", f"Exception: {str(e)}")
        return False, ""

def test_local_api_comparison():
    """
    Compare Railway API with local API to identify differences
    """
    try:
        payload = {
            "passage": "Genèse 1",
            "version": "LSG", 
            "tokens": 500,
            "use_gemini": True,
            "enriched": True
        }
        
        headers = {"Content-Type": "application/json"}
        
        print(f"🔄 Comparing with local API: {LOCAL_API_URL}/api/generate-verse-by-verse")
        
        response = requests.post(f"{LOCAL_API_URL}/api/generate-verse-by-verse", 
                               json=payload, 
                               headers=headers, 
                               timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            content = data.get("content", "")
            content_length = len(content)
            
            print(f"📏 Local API content length: {content_length} characters")
            
            # Check for real Genesis text in local API
            genesis_1_1_variations = [
                "au commencement, dieu créa les cieux et la terre",
                "au commencement dieu créa les cieux et la terre",
                "commencement dieu créa cieux terre"
            ]
            
            has_real_genesis_text = any(variation in content.lower() for variation in genesis_1_1_variations)
            
            # Check theological quality
            theological_terms = [
                "création", "créateur", "commencement", "dieu", "théologique",
                "spirituel", "divin", "biblique"
            ]
            found_theological_terms = [term for term in theological_terms if term.lower() in content.lower()]
            
            print(f"   ✅ Local API - Real Genesis text: {'YES' if has_real_genesis_text else 'NO'}")
            print(f"   🎓 Local API - Theological terms: {len(found_theological_terms)}")
            
            log_test("Local API Comparison", "PASS", 
                    f"Local API response: {content_length} chars, Genesis text: {has_real_genesis_text}")
            return True, content
        else:
            log_test("Local API Comparison", "FAIL", 
                    f"Local API failed: HTTP {response.status_code}")
            return False, ""
            
    except Exception as e:
        log_test("Local API Comparison", "FAIL", f"Exception: {str(e)}")
        return False, ""

def analyze_content_structure(content, api_name):
    """
    Detailed analysis of content structure to identify issues
    """
    print(f"\n🔬 DETAILED STRUCTURE ANALYSIS - {api_name}")
    print("=" * 60)
    
    # Count structural elements
    verse_sections = re.findall(r'\*\*VERSET \d+\*\*', content)
    biblical_text_sections = re.findall(r'\*\*TEXTE BIBLIQUE\s*:\*\*', content)
    theological_sections = re.findall(r'\*\*EXPLICATION THÉOLOGIQUE\s*:\*\*', content)
    
    print(f"📊 Structural Elements:")
    print(f"   - VERSET sections: {len(verse_sections)}")
    print(f"   - TEXTE BIBLIQUE sections: {len(biblical_text_sections)}")
    print(f"   - EXPLICATION THÉOLOGIQUE sections: {len(theological_sections)}")
    
    # Analyze each theological explanation
    if theological_sections:
        print(f"\n📚 Theological Explanations Analysis:")
        
        # Split content by theological sections
        parts = re.split(r'\*\*EXPLICATION THÉOLOGIQUE\s*:\*\*', content)
        
        for i, part in enumerate(parts[1:], 1):  # Skip first part (before first explanation)
            # Get text until next major section
            explanation_text = re.split(r'\*\*(?:VERSET|TEXTE BIBLIQUE)', part)[0].strip()
            
            # Clean and analyze
            clean_text = re.sub(r'\*\*.*?\*\*', '', explanation_text)
            clean_text = re.sub(r'[^\w\s]', ' ', clean_text)
            words = [word for word in clean_text.split() if len(word) > 3]
            
            print(f"   Explanation {i}: {len(words)} meaningful words")
            
            if len(words) < 10:
                print(f"      ⚠️  TOO SHORT - Likely generic content")
            elif len(words) > 50:
                print(f"      ✅ SUBSTANTIAL - Good theological content")
            else:
                print(f"      ⚠️  MODERATE - May need improvement")
    
    # Check for specific problematic patterns
    problematic_patterns = [
        r"Texte du verset \d+ \([^)]+\)",
        r"Contenu générique",
        r"Lorem ipsum",
        r"Placeholder",
        r"TODO",
        r"À compléter"
    ]
    
    found_problems = []
    for pattern in problematic_patterns:
        matches = re.findall(pattern, content, re.IGNORECASE)
        if matches:
            found_problems.extend(matches)
    
    if found_problems:
        print(f"\n❌ PROBLEMATIC PATTERNS FOUND:")
        for problem in found_problems[:5]:  # Show first 5
            print(f"   - {problem}")
    else:
        print(f"\n✅ NO PROBLEMATIC PATTERNS DETECTED")

def run_railway_diagnostic():
    """
    Run complete diagnostic of Railway API issue
    """
    print("=" * 80)
    print("CRITICAL RAILWAY API DIAGNOSTIC - GENERIC CONTENT ISSUE")
    print("=" * 80)
    print("USER REPORT: 'verset par verset' shows generic content:")
    print("- 'Texte du verset 1 (Genèse 1:1)' instead of real biblical text")
    print("- Empty or generic 'EXPLICATION THÉOLOGIQUE' sections")
    print()
    print("OBJECTIVE: Determine if Railway API returns generic content")
    print("=" * 80)
    
    # Test 1: Direct Railway API test
    print("\n1. DIRECT RAILWAY API TEST")
    print("-" * 40)
    railway_success, railway_content = test_railway_api_direct()
    
    # Test 2: Local API comparison
    print("\n2. LOCAL API COMPARISON")
    print("-" * 40)
    local_success, local_content = test_local_api_comparison()
    
    # Test 3: Detailed content analysis
    if railway_content:
        analyze_content_structure(railway_content, "RAILWAY API")
    
    if local_content:
        analyze_content_structure(local_content, "LOCAL API")
    
    # Final diagnosis
    print("\n" + "=" * 80)
    print("DIAGNOSTIC CONCLUSION")
    print("=" * 80)
    
    if railway_success and local_success:
        print("✅ BOTH APIS WORKING CORRECTLY")
        print("   → Issue likely in frontend processing/display")
        print("   → Check frontend formatContent() function")
        return True
    elif not railway_success and local_success:
        print("❌ RAILWAY API ISSUE CONFIRMED")
        print("   → Railway API returns generic/placeholder content")
        print("   → Local API works correctly")
        print("   → User's report is accurate - Railway API needs fixing")
        return False
    elif railway_success and not local_success:
        print("❌ LOCAL API ISSUE")
        print("   → Railway API works correctly")
        print("   → Local API has problems")
        print("   → Frontend should use Railway API")
        return False
    else:
        print("❌ BOTH APIS HAVE ISSUES")
        print("   → Critical backend problems")
        print("   → Both APIs need investigation")
        return False

if __name__ == "__main__":
    success = run_railway_diagnostic()
    sys.exit(0 if success else 1)