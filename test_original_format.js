// Test de la fonction formatContent ORIGINALE restaurée
const content = `**VERSET 1**

**TEXTE BIBLIQUE :**
Au commencement, Dieu créa les cieux et la terre.

**EXPLICATION THÉOLOGIQUE :**
Ce verset inaugure toute l'Écriture et révèle des vérités fondamentales...`;

const formatContent = (text, context = 'default') => {
  if (!text) return "";
  
  let formattedText = text
    .replace(/^\*\*VERSET (\d+)\*\*$/gim, "<h2 class='verset-header'>📖 VERSET $1</h2>")
    .replace(/^\*\*TEXTE BIBLIQUE\s*:\*\*$/gim, "<h4 class='texte-biblique-label'>📜 TEXTE BIBLIQUE :</h4>")
    .replace(/^\*\*EXPLICATION THÉOLOGIQUE\s*:\*\*$/gim, "<h4 class='explication-label'>🎓 EXPLICATION THÉOLOGIQUE :</h4>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^\# (.*$)/gim, "<h1>$1</h1>")
    .replace(/^\## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^\### (.*$)/gim, "<h3>$1</h3>")
    .split("\n\n")
    .map(p => (p.trim() ? `<p>${p.replace(/\n/g, "<br>")}</p>` : ""))
    .join("");

  if (context === 'versets-prog') {
    return `<div class="versets-prog-content">${formattedText}</div>`;
  }
  
  return formattedText;
};

console.log("=== FORMAT ORIGINAL RESTAURÉ ===");
const result = formatContent(content, 'versets-prog');
console.log(result);
console.log("\n=== VERSION LISIBLE ===");
console.log(result.replace(/></g, '>\n<'));
