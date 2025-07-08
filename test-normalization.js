const text = `RUHE: N10: Blockierung N10-100 Einfuhrrinne
Letze Käse vorbei Blockierung (Sortentrennung SCHRITT 2)

    SCHRITT 1: Freigabe?
NICHT HMI01 HAND
Sicherheitsbereich 1 OK
NICHT Blockierung Geschlossen (N10-100)

    SCHRITT 2: Schließen Blockierung N10-100
NICHT Blockierung Geöffnet (N10-100)
Blockierung Geschlossen (N10-100)`;

console.log('Original:');
console.log(text);

// Test current normalization
function normalizeStepFormatting(text) {
  // First, ensure SCHRITT keywords get their own lines by adding line breaks before them
  let normalized = text
    // Add line breaks before SCHRITT/STAP/STEP keywords that are not at start of line
    // Match pattern: (any text) SCHRITT <number>: (rest)
    .replace(/([^\n]+?)\s+(SCHRITT|STAP|STEP)\s+(\d+)\s*[:.]?\s*([^\n]*)/gmi, (match, before, keyword, number, after) => 
      `${before.trim()}\n${keyword.toUpperCase()} ${number}: ${after}`)
    // Add line breaks before RUST/RUHE/IDLE keywords that are not at start of line  
    .replace(/([^\n]+?)\s+(RUST|RUHE|IDLE)\s*[:.]?\s*([^\n]*)/gmi, (match, before, keyword, after) => 
      `${before.trim()}\n${keyword.toUpperCase()}: ${after}`);

  return normalized
    // Normalize RUST/RUHE/IDLE - make more flexible
    .replace(/^\s*(RUST|RUHE|IDLE)\s*[:.]?\s*/gmi, (match, keyword) => `${keyword.toUpperCase()}: `)
    // Normalize SCHRITT/STAP/STEP - handle various formats
    .replace(/^\s*(SCHRITT|STAP|STEP)\s*[-.]?\s*(\d+)\s*[:.]?\s*/gmi, (match, keyword, number) => 
      `${keyword.toUpperCase()} ${number}: `)
    // Handle step without number (default to 1)
    .replace(/^\s*(SCHRITT|STAP|STEP)\s*[:.](?!\s*\d)/gmi, (match, keyword) => 
      `${keyword.toUpperCase()} 1: `)
    // Normalize VON SCHRITT declarations
    .replace(/^\s*(\+?\s*VON\s+(?:SCHRITT|STAP|STEP)\s+\d+)\s*$/gmi, (match, declaration) => 
      declaration.toUpperCase())
    // Fix common spacing issues around colons
    .replace(/(\w)\s*:\s*/g, '$1: ')
    // Remove extra spaces
    .replace(/\s{2,}/g, ' ');
}

console.log('\nNormalized:');
console.log(normalizeStepFormatting(text));