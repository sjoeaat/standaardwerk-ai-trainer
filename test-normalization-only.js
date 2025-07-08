const text = `RUHE: Test

NICHT HMI01 HAND
Sicherheitsbereich 1 OK

SCHRITT 1: Freigabe?
Test condition

SCHRITT 2: Next step`;

console.log('Original:');
console.log(text);

// Test just the NEW normalization step by step
function normalizeStepFormatting(text) {
  // Split into lines to work line by line, avoiding cross-line regex issues
  const lines = text.split('\n');
  const normalizedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    console.log(`Processing line ${i+1}: "${line}"`);
    
    // Check if this line contains embedded SCHRITT/STAP/STEP keywords
    const schrittMatch = line.match(/^(.+?)\s+(SCHRITT|STAP|STEP)\s+(\d+)\s*[:.]?\s*(.*)$/i);
    if (schrittMatch && !line.trim().startsWith('SCHRITT') && !line.trim().startsWith('STAP') && !line.trim().startsWith('STEP')) {
      // Split the line: before part + new line with SCHRITT
      const [, before, keyword, number, after] = schrittMatch;
      console.log(`  -> Found embedded SCHRITT: "${before}" + "${keyword} ${number}: ${after}"`);
      normalizedLines.push(before.trim());
      normalizedLines.push(`${keyword.toUpperCase()} ${number}: ${after}`);
      continue;
    }
    
    // Check if this line contains embedded RUST/RUHE/IDLE keywords  
    const rustMatch = line.match(/^(.+?)\s+(RUST|RUHE|IDLE)\s*[:.]?\s*(.*)$/i);
    if (rustMatch && !line.trim().startsWith('RUST') && !line.trim().startsWith('RUHE') && !line.trim().startsWith('IDLE')) {
      // Split the line: before part + new line with RUST
      const [, before, keyword, after] = rustMatch;
      console.log(`  -> Found embedded RUST: "${before}" + "${keyword}: ${after}"`);
      normalizedLines.push(before.trim());
      normalizedLines.push(`${keyword.toUpperCase()}: ${after}`);
      continue;
    }
    
    // No embedded keywords, keep line as is
    console.log(`  -> Keeping as is`);
    normalizedLines.push(line);
  }
  
  console.log('\n--- After line processing ---');
  normalizedLines.forEach((line, i) => {
    console.log(`${i+1}: "${line}"`);
  });

  // Rejoin and apply final normalization
  return normalizedLines.join('\n')
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

console.log('\n=== RESULT ===');
const result = normalizeStepFormatting(text);
console.log(result);

console.log('\n=== LINES ===');
result.split('\n').forEach((line, i) => {
  console.log(`${i+1}: "${line}"`);
});