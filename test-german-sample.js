// Test German sample parsing
import { UnifiedTextParser } from './src/core/UnifiedTextParser.js';
import { readFileSync } from 'fs';
import { defaultSyntaxRules } from './src/config/syntaxRules.js';

const text = `RUHE: N10: Blockierung N10-100 Einfuhrrinne
Letze Käse vorbei Blockierung (Sortentrennung SCHRITT 2)

    SCHRITT 1: Freigabe?
NICHT HMI01 HAND
Sicherheitsbereich 1 OK
NICHT Blockierung Geschlossen (N10-100)

    SCHRITT 2: Schließen Blockierung N10-100
NICHT Blockierung Geöffnet (N10-100)
Blockierung Geschlossen (N10-100)

    SCHRITT 3: Blockierung N10-100 geschlossen
Keine Käse im N10 vorbei Blockierung (Sortentrennung SCHRITT 4)

    SCHRITT 4: Freigabe?
NICHT HMI01 HAND
Sicherheitsbereich 1 OK
NICHT Blockierung Geöffnet (N10-100)

    SCHRITT 5: Blockierung N10-100 Öffnen
Blockierung Geöffnet (N10-100)
NICHT Blockierung Geschlossen (N10-100)
    
    SCHRITT 6: Fertig

Start öffnen N10-100 (auto H) =
NICHT Start schließen N10-100


Start schließen N10-100 (auto L) =
SCHRITT 2-4


Störung: Einfuhrbahn T10C nicht unten erwartet (T10-205) =
SETZEN    SCHRITT 4-5
Einfuhrbahn T10C unten (T10-205)

RÜCKSETZEN    NICHT SETZEN-Bedingungen
Hand HMI10`;

console.log('=== TESTING GERMAN SAMPLE ===');
console.log('Input text (first 200 chars):');
console.log(text.substring(0, 200) + '...');
console.log('\n=== PARSING RESULT ===');

const parser = new UnifiedTextParser(defaultSyntaxRules);
const result = parser.parse(text, 'manual', { language: 'German' });

console.log('Steps found:', result.steps.length);
result.steps.forEach((step, i) => {
  console.log(`Step ${i+1}: Type=${step.type}, Number=${step.number}, Description='${step.description}'`);
});

console.log('\nVariables found:', result.variables.length);
result.variables.forEach((variable, i) => {
  console.log(`Variable ${i+1}: Name=${variable.name}, Type=${variable.type}`);
});

console.log('\nErrors:', result.errors.length);
result.errors.forEach(error => console.log(`  - ${error.type}: ${error.message}`));

console.log('\nWarnings:', result.warnings.length);
result.warnings.forEach(warning => console.log(`  - ${warning.type}: ${warning.message}`));