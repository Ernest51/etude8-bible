// Test exact de la fonction formatContent
const content = `**VERSET 1**

**TEXTE BIBLIQUE :**
Au commencement, Dieu créa les cieux et la terre.

**EXPLICATION THÉOLOGIQUE :**
Ce verset inaugure toute l'Écriture et révèle des vérités fondamentales...`;

console.log("=== CONTENU ORIGINAL ===");
console.log(content);

// Simuler la fonction formatContent exactement comme dans App.js
const formatContent = (text, context = 'default') => {
  if (!text) return "";
  
  // Formatage avec contexte pour VERSETS PROG
  let formattedText = text
    // D'abord transformer les labels spécifiques AVANT la transformation générale **text**
    .replace(/^\*\*VERSET (\d+)\*\*$/gim, "<h2 class='verset-header'>📖 VERSET $1</h2>")
    .replace(/^\*\*TEXTE BIBLIQUE\s*:\*\*$/gim, "<h4 class='texte-biblique-label'>📜 TEXTE BIBLIQUE :</h4>")
    .replace(/^\*\*EXPLICATION THÉOLOGIQUE\s*:\*\*$/gim, "<h4 class='explication-label'>🎓 EXPLICATION THÉOLOGIQUE :</h4>")
    // Puis transformer les autres éléments en gras génériques
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^\# (.*$)/gim, "<h1>$1</h1>")
    .replace(/^\## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^\### (.*$)/gim, "<h3>$1</h3>")
    .split("\n\n")
    .map(p => (p.trim() ? `<p>${p.replace(/\n/g, "<br>")}</p>` : ""))
    .join("");

  // Wrapper spécial pour le contexte VERSETS PROG
  if (context === 'versets-prog') {
    return `<div class="versets-prog-content">${formattedText}</div>`;
  }
  
  return formattedText;
};

console.log("\n=== ÉTAPES DE TRANSFORMATION ===");
let step1 = content.replace(/^\*\*VERSET (\d+)\*\*$/gim, "<h2 class='verset-header'>📖 VERSET $1</h2>");
console.log("1. Après VERSET regex:");
console.log(step1);

let step2 = step1.replace(/^\*\*TEXTE BIBLIQUE\s*:\*\*$/gim, "<h4 class='texte-biblique-label'>📜 TEXTE BIBLIQUE :</h4>");
console.log("\n2. Après TEXTE BIBLIQUE regex:");
console.log(step2);

let step3 = step2.replace(/^\*\*EXPLICATION THÉOLOGIQUE\s*:\*\*$/gim, "<h4 class='explication-label'>🎓 EXPLICATION THÉOLOGIQUE :</h4>");
console.log("\n3. Après EXPLICATION regex:");
console.log(step3);

console.log("\n=== RÉSULTAT FINAL ===");
const finalResult = formatContent(content, 'versets-prog');
console.log(finalResult);
