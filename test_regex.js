const content = `**VERSET 1**

**TEXTE BIBLIQUE :**
Au commencement était la Parole, et la Parole était avec Dieu, et la Parole était Dieu.

**EXPLICATION THÉOLOGIQUE :**
Ce verset introductif de l'Évangile de Jean établit immédiatement la divinité de Jésus-Christ...`;

console.log("Original content:");
console.log(content);
console.log("\nTesting regex transformations:");

// Test transformations
let formattedText = content
  .replace(/^\*\*VERSET (\d+)\*\*$/gim, "<h2 class='verset-header'>📖 VERSET $1</h2>")
  .replace(/^\*\*TEXTE BIBLIQUE\s*:\*\*$/gim, "<h4 class='texte-biblique-label'>📜 TEXTE BIBLIQUE :</h4>")
  .replace(/^\*\*EXPLICATION THÉOLOGIQUE\s*:\*\*$/gim, "<h4 class='explication-label'>🎓 EXPLICATION THÉOLOGIQUE :</h4>");

console.log("After regex transformations:");
console.log(formattedText);

// Test specific patterns
console.log("\nTesting individual patterns:");
console.log("VERSET pattern match:", /^\*\*VERSET (\d+)\*\*$/gim.test("**VERSET 1**"));
console.log("TEXTE BIBLIQUE pattern match:", /^\*\*TEXTE BIBLIQUE\s*:\*\*$/gim.test("**TEXTE BIBLIQUE :**"));
console.log("EXPLICATION pattern match:", /^\*\*EXPLICATION THÉOLOGIQUE\s*:\*\*$/gim.test("**EXPLICATION THÉOLOGIQUE :**"));
