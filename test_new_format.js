// Test de la nouvelle fonction formatContent
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
    .replace(/^\### (.*$)/gim, "<h3>$1</h3>");

  if (context === 'versets-prog') {
    let blocks = formattedText.split(/\n\s*\n/);
    let processedBlocks = blocks.map(block => {
      block = block.trim();
      if (!block) return "";
      
      // Si le bloc commence par un header, ne pas le wrapper
      if (block.match(/^<h[1-6]/i) || block.match(/^<h[1-6][^>]*class=['"](?:verset-header|texte-biblique-label|explication-label)['"][^>]*>/i)) {
        return block;
      }
      
      // Sinon, wrapper dans un paragraphe
      return `<p>${block.replace(/\n/g, "<br>")}</p>`;
    }).filter(block => block);
    
    return `<div class="versets-prog-content">${processedBlocks.join("")}</div>`;
  }
  
  return formattedText;
};

console.log("=== NOUVEAU FORMAT HTML ===");
const result = formatContent(content, 'versets-prog');
console.log(result);
console.log("\n=== VERSION LISIBLE ===");
console.log(result.replace(/></g, '>\n<'));
