// Test step detection with provided German sample

const testText = `RUHE: N10: Blockierung N10-100 Einfuhrrinne
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

// Import parser
import { UnifiedTextParser } from './src/core/UnifiedTextParser.js';
import { defaultSyntaxRules } from './src/config/syntaxRules.js';

console.log('🔍 Testing step detection with German sample...\n');

// Create parser instance
const parser = new UnifiedTextParser(defaultSyntaxRules);

// Parse the text
const result = parser.parse(testText, 'manual');

// Display results
console.log('📊 Parsing Results:');
console.log('=================');

if (result.programs && result.programs.length > 0) {
    result.programs.forEach((program, idx) => {
        console.log(`\n📋 Program ${idx + 1}: ${program.name}`);
        console.log(`Type: ${program.type}`);
        console.log(`Steps found: ${program.steps ? program.steps.length : 0}`);
        
        if (program.steps) {
            program.steps.forEach((step, stepIdx) => {
                console.log(`  - SCHRITT ${step.number}: ${step.name || 'Unnamed'}`);
            });
        }
    });
} else {
    console.log('❌ No programs found!');
}

// Check for errors
if (result.errors && result.errors.length > 0) {
    console.log('\n⚠️ Errors:');
    result.errors.forEach(error => {
        console.log(`  - ${error.message} (line ${error.line})`);
    });
}

// Show raw parsing data for debugging
console.log('\n🔧 Debug Info:');
console.log('Normalized line count:', result.parsingMetadata?.normalizedLineCount);
console.log('Original line count:', result.parsingMetadata?.originalLineCount);

// Check if steps were detected at all
const stepLines = testText.split('\n').filter(line => line.includes('SCHRITT'));
console.log(`\n📍 Lines containing 'SCHRITT': ${stepLines.length}`);
stepLines.forEach(line => console.log(`  - "${line.trim()}"`));