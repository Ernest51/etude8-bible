# URGENT FIX FOR VERCEL

The Vercel deployment has inconsistent API endpoints:
- Environment configured for: https://faithai-tools.preview.emergentagent.com/api
- But VERSETS PROG calls: https://etude8-bible-api-production.up.railway.app/api

## Solution:
Change all API calls to use API_BASE consistently.

File to fix: src/App.js line ~468