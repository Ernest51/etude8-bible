// Test des regex élargies pour format preview
const previewContent = `VERSE T2

TEXTE BIBLIQUE :
La terre était informe et vide : il y avait des ténèbres à la surface de l'abîme, et l'Esprit de Dieu se mouvait au-dessus des eaux.

EXPLICATION THÉOLOGIQUE :
Ce verset décrit l'état initial de la création : un chaos informe et désolé...

VERSE T3

TEXTE BIBLIQUE :
Dieu dit : Que la lumière soit ! Et la lumière fut.

EXPLICATION THÉOLOGIQUE :
Ce verset marque le début de l'œuvre créatrice de Dieu par sa Parole...`;

const formatContent = (text) => {
  let formattedText = text
    .replace(/^\*\*VERSET (\d+)\*\*$/gim, "<h2 class='verset-header'>📖 VERSET $1</h2>")
    .replace(/^VERSE\s*T(\d+)$/gim, "<h2 class='verset-header'>📖 VERSET $1</h2>")  // Format preview
    .replace(/^VERSET\s*(\d+)$/gim, "<h2 class='verset-header'>📖 VERSET $1</h2>")    // Format alternatif
    .replace(/^\*\*TEXTE BIBLIQUE\s*:\*\*$/gim, "<h4 class='texte-biblique-label'>📜 TEXTE BIBLIQUE :</h4>")
    .replace(/^TEXTE BIBLIQUE\s*:?$/gim, "<h4 class='texte-biblique-label'>📜 TEXTE BIBLIQUE :</h4>")  // Format preview
    .replace(/^\*\*EXPLICATION THÉOLOGIQUE\s*:\*\*$/gim, "<h4 class='explication-label'>🎓 EXPLICATION THÉOLOGIQUE :</h4>")
    .replace(/^EXPLICATION THÉOLOGIQUE\s*:?$/gim, "<h4 class='explication-label'>🎓 EXPLICATION THÉOLOGIQUE :</h4>")  // Format preview
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .split("\n\n")
    .map(p => (p.trim() ? `<p>${p.replace(/\n/g, "<br>")}</p>` : ""))
    .join("");

  return `<div class="versets-prog-content">${formattedText}</div>`;
};

console.log("=== CONTENU PREVIEW ORIGINAL ===");
console.log(previewContent);
console.log("\n=== APRÈS TRANSFORMATION ===");
const result = formatContent(previewContent);
console.log(result.replace(/></g, '>\n<'));
