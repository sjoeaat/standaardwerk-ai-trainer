const text = 'SCHRITT 1: Freigabe?';
const pattern = /^(RUST|RUHE|IDLE|STAP|SCHRITT|STEP)(?:\s+(\d+))?:\s*(.*)$/i;
console.log('Testing:', text);
console.log('Pattern:', pattern);
console.log('Match:', text.match(pattern));

// Test different variations
const variations = [
  'SCHRITT 1: Freigabe?',
  'SCHRITT1: Freigabe?',
  'SCHRITT: Freigabe?',
  'RUHE: Description'
];

variations.forEach(v => {
  console.log(`\n"${v}" matches:`, v.match(pattern));
});