// Debug script voor parser testing - kopieer naar browser console

const testSample = `Hauptprogramm Einfuhr FB100
Symbolik IDB: Haupt_Einfuhr

RUHE: Hauptprogramm Einfuhr
- Freigabe Start Einfuhr
- DT Start Einfuhr

SCHRITT 1: Selektiere 1e zu füllen Horde
- Horde vorselektiert (Selektionsprogramm Horde für Einfuhr SCHRITT 2+5+8+11)

SCHRITT 2: Warten bis Horde und Einfuhrwagen bereit für Füllen
- Füllen 1e Horde aktiv:
  - Füllen Horde aktiv (Füllen Horde N21 SCHRITT 7)
  - + Füllen Horde aktiv (Füllen Horde N22 SCHRITT 7)

SCHRITT 3: Produktion
- DT Ende Einfuhr
- +Ende Produktion (K5 in Ruhe) (Komm. von K5)`;

console.log('🧪 TESTING PARSER WITH SAMPLE DATA');
console.log('==================================');

// Test de verschillende onderdelen van de parser
console.log('Sample input:');
console.log(testSample);

console.log('\n📝 Lines containing SCHRITT or RUHE:');
testSample.split('\n').forEach((line, index) => {
  if (line.toLowerCase().includes('schritt') || line.toLowerCase().includes('ruhe')) {
    console.log(`Line ${index + 1}: "${line.trim()}"`);
  }
});

console.log('\n🔍 Lines containing cross-references:');
testSample.split('\n').forEach((line, index) => {
  if (line.includes('(') && line.includes('SCHRITT')) {
    console.log(`Line ${index + 1}: "${line.trim()}"`);
  }
});

console.log('\n⚙️ Testing regex patterns:');
const stepPattern = /^(RUST|RUHE|IDLE|STAP|SCHRITT|STEP)(?:\s+(\d+))?:\s*(.*)$/i;
testSample.split('\n').forEach((line, index) => {
  const trimmed = line.trim();
  const match = trimmed.match(stepPattern);
  if (match) {
    console.log(`Line ${index + 1}: MATCH - "${match[1]}" "${match[2] || 'no number'}" "${match[3] || 'no description'}"`);
  }
});

console.log('\n🎯 Testing cross-reference pattern:');
const crossRefPattern = /^(.+?)\s*\(([^)]+)\s+(SCHRITT|STAP|STEP)\s+([0-9+]+)\)\s*$/i;
testSample.split('\n').forEach((line, index) => {
  const trimmed = line.trim();
  const match = trimmed.match(crossRefPattern);
  if (match) {
    console.log(`Line ${index + 1}: CROSS-REF - "${match[1]}" program:"${match[2]}" steps:"${match[4]}"`);
  }
});

// Probeer met kopie van dit script in browser console!