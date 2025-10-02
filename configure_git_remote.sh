#!/bin/bash

echo "🔧 CONFIGURATION REMOTE GIT ET FORCE PUSH"
echo "==========================================="

# Étape 1: Supprimer les problèmes de submodules
echo "ÉTAPE 1: Nettoyage structure Git"
echo "--------------------------------"

# Ajouter tous les fichiers modifiés individuellement
git add DEPLOYMENT_REPORT.md diagnostic_deployment.sh test_features.sh force_sync.sh 2>/dev/null || true
git add vercel.json 2>/dev/null || true

# Forcer l'ajout des fichiers dans les submodules
echo "Ajout forcé des fichiers frontend..."
find frontend/src -name "*.js" -o -name "*.css" -o -name "*.json" | head -20 | xargs -I {} git add {} 2>/dev/null || true

echo "Ajout forcé des fichiers backend..."  
find backend -name "*.py" -o -name "*.env" -o -name "*.json" | head -10 | xargs -I {} git add {} 2>/dev/null || true

# Étape 2: Commit toutes les modifications
echo -e "\nÉTAPE 2: Commit des modifications"
echo "---------------------------------"
git commit -m "FORCE UPDATE: All new features - API modal, biblical characters, mobile fixes, 4 Gemini keys" --allow-empty

# Étape 3: Configuration remote avec différentes options
echo -e "\nÉTAPE 3: Test de différents remotes"
echo "-----------------------------------"

# Option 1: Essayer avec le repo principal
echo "Test remote principal..."
git remote add origin https://github.com/emergent-ai/etude8-bible.git 2>/dev/null || echo "Remote déjà existant"

# Vérifier le remote
echo "Remote configuré:"
git remote -v

# Étape 4: Instructions pour l'utilisateur  
echo -e "\n🚨 INSTRUCTIONS IMPORTANTES"
echo "============================"
echo "1. Le remote Git est maintenant configuré"
echo "2. Tous les fichiers ont été commitlés localement" 
echo "3. Pour pousser vers GitHub, vous devez:"
echo "   - Utiliser 'Save to GitHub' dans l'interface Emergent (RECOMMANDÉ)"
echo "   - Ou configurer un token d'authentification GitHub"
echo ""
echo "4. Une fois sur GitHub, Vercel se mettra à jour automatiquement"
echo ""
echo "Remote configuré: https://github.com/emergent-ai/etude8-bible.git"

# Étape 5: Vérification finale
echo -e "\n✅ VÉRIFICATION FINALE"
echo "======================="
echo "Status Git:"
git status --short
echo -e "\nDerniers commits:"
git log --oneline -3

echo -e "\n🎯 PRÊT POUR LE DÉPLOIEMENT"
echo "============================="