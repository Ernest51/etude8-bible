#!/bin/bash

echo "🔍 DIAGNOSTIC DÉPLOIEMENT - ANALYSE COMPLÈTE"
echo "=============================================="

echo "1. VÉRIFICATION GIT STATUS"
echo "----------------------------"
git status

echo -e "\n2. VÉRIFICATION REMOTES GIT"
echo "----------------------------"
git remote -v

echo -e "\n3. VÉRIFICATION BRANCHES"
echo "-------------------------"
git branch -a

echo -e "\n4. VÉRIFICATION DERNIERS COMMITS"
echo "-----------------------------------"
git log --oneline -5

echo -e "\n5. VÉRIFICATION FICHIERS FRONTEND"
echo "----------------------------------"
echo "Fichiers React modifiés :"
find frontend/src -name "*.js" -exec ls -la {} \; | head -10

echo -e "\n6. VÉRIFICATION PACKAGE.JSON"
echo "-----------------------------"
if [ -f frontend/package.json ]; then
  echo "✅ package.json existe"
  grep -E '"name"|"version"|"scripts"' frontend/package.json | head -5
else
  echo "❌ package.json manquant"
fi

echo -e "\n7. VÉRIFICATION .ENV BACKEND"
echo "----------------------------"
if [ -f backend/.env ]; then
  echo "✅ .env backend existe"
  grep -c "GEMINI_API_KEY" backend/.env
  echo "Nombre de clés Gemini configurées"
else
  echo "❌ .env backend manquant"
fi

echo -e "\n8. TEST COMPILATION FRONTEND"
echo "----------------------------"
cd frontend
if npm list react > /dev/null 2>&1; then
  echo "✅ React installé"
else
  echo "❌ Problème avec React"
fi

echo -e "\n9. STRUCTURE FICHIERS CRITIQUES"
echo "--------------------------------"
cd /app
echo "App.js :" $(wc -l frontend/src/App.js)
echo "RubriquePage.js :" $(wc -l frontend/src/RubriquePage.js) 
echo "BibleConcordancePage.js :" $(wc -l frontend/src/BibleConcordancePage.js)
echo "App.css :" $(wc -l frontend/src/App.css)

echo -e "\n10. DÉTECTION NOUVELLES FONCTIONNALITÉS"
echo "----------------------------------------"
echo "Recherche 'biblical-character-btn' :" $(grep -c "biblical-character-btn" frontend/src/BibleConcordancePage.js)
echo "Recherche 'generateCharacterHistory' :" $(grep -c "generateCharacterHistory" frontend/src/BibleConcordancePage.js)
echo "Recherche 'API Status' :" $(grep -c "API Status" frontend/src/RubriquePage.js)
echo "Recherche 'GEMINI_API_KEY_4' :" $(grep -c "GEMINI_API_KEY_4" backend/.env)

echo -e "\n🔍 DIAGNOSTIC TERMINÉ"
echo "====================="