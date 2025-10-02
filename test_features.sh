#!/bin/bash

echo "🧪 TEST DE VALIDATION DES FONCTIONNALITÉS"
echo "=========================================="

# Test 1: Vérifier les nouvelles fonctionnalités dans le code
echo "TEST 1: Nouvelles fonctionnalités détectées"
echo "--------------------------------------------"

# Vérification RubriquePage
if grep -q "API Status" frontend/src/RubriquePage.js; then
  echo "✅ Modal API présent dans RubriquePage.js"
else
  echo "❌ Modal API manquant dans RubriquePage.js"
fi

if grep -q "control-btn" frontend/src/RubriquePage.js; then
  echo "✅ Boutons de contrôle présents dans RubriquePage.js"
else
  echo "❌ Boutons de contrôle manquants dans RubriquePage.js"
fi

# Vérification BibleConcordancePage
if grep -q "biblical-characters-grid" frontend/src/BibleConcordancePage.js; then
  echo "✅ Personnages bibliques présents dans BibleConcordancePage.js"
else
  echo "❌ Personnages bibliques manquants dans BibleConcordancePage.js"
fi

if grep -q "handleGeminiConcordance\|handleGeminiCharacter" frontend/src/BibleConcordancePage.js; then
  echo "✅ Boutons Gemini présents dans BibleConcordancePage.js"
else
  echo "❌ Boutons Gemini manquants dans BibleConcordancePage.js"
fi

# Vérification Backend
if grep -q "GEMINI_API_KEY_4" backend/.env; then
  echo "✅ 4ème clé Gemini configurée dans backend/.env"
else
  echo "❌ 4ème clé Gemini manquante dans backend/.env"
fi

# Vérification CSS Mobile
if grep -q "calc(100vw - 16px)" frontend/src/App.css; then
  echo "✅ Corrections mobile présentes dans App.css"
else
  echo "❌ Corrections mobile manquantes dans App.css"
fi

echo -e "\nTEST 2: Taille des fichiers (indication de modifications)"
echo "--------------------------------------------------------"
ORIGINAL_APP_SIZE=50000  # Taille approximative originale
ORIGINAL_RUBRIQUE_SIZE=5000
ORIGINAL_CONCORDANCE_SIZE=10000

APP_SIZE=$(wc -c < frontend/src/App.js)
RUBRIQUE_SIZE=$(wc -c < frontend/src/RubriquePage.js)
CONCORDANCE_SIZE=$(wc -c < frontend/src/BibleConcordancePage.js)

echo "App.js: $APP_SIZE bytes (original ~$ORIGINAL_APP_SIZE)"
echo "RubriquePage.js: $RUBRIQUE_SIZE bytes (original ~$ORIGINAL_RUBRIQUE_SIZE)"
echo "BibleConcordancePage.js: $CONCORDANCE_SIZE bytes (original ~$ORIGINAL_CONCORDANCE_SIZE)"

if [ $APP_SIZE -gt $ORIGINAL_APP_SIZE ]; then
  echo "✅ App.js significativement élargi (nouvelles fonctionnalités)"
else
  echo "❌ App.js taille suspecte"
fi

if [ $RUBRIQUE_SIZE -gt $ORIGINAL_RUBRIQUE_SIZE ]; then
  echo "✅ RubriquePage.js significativement élargi (modal + boutons)"
else
  echo "❌ RubriquePage.js taille suspecte"
fi

if [ $CONCORDANCE_SIZE -gt $ORIGINAL_CONCORDANCE_SIZE ]; then
  echo "✅ BibleConcordancePage.js significativement élargi (personnages)"
else
  echo "❌ BibleConcordancePage.js taille suspecte"
fi

echo -e "\nTEST 3: Vérification de la structure des submodules"
echo "---------------------------------------------------"
if [ -d "frontend/.git" ]; then
  echo "✅ Frontend est un repo Git indépendant"
elif [ -f "frontend/.git" ]; then
  echo "⚠️  Frontend est un submodule Git"
else
  echo "❌ Frontend n'est pas un repo Git"
fi

if [ -d "backend/.git" ]; then
  echo "✅ Backend est un repo Git indépendant"
elif [ -f "backend/.git" ]; then
  echo "⚠️  Backend est un submodule Git"
else
  echo "❌ Backend n'est pas un repo Git"
fi

echo -e "\n🧪 RÉSULTAT DU TEST"
echo "==================="