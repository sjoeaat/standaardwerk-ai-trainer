// Test script to validate parsing with real Word document content
import { EnhancedLogicParser } from './src/core/EnhancedLogicParser.js';
import { standardSyntaxRules } from './src/core/syntaxRules.js';

const testContent = `Hauptprogramm Einfuhr FB100
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
  - + Füllen Horde aktiv (Füllen Horde N23 SCHRITT 7)
  - + Füllen Horde aktiv (Füllen Horde N24 SCHRITT 7)

SCHRITT 3: Produktion
- DT Ende Einfuhr
- +Ende Produktion (K5 in Ruhe) (Komm. von K5)

SCHRITT 4: Start leerdrehen Einfuhrinne N10/N11
- Strömung Einfuhrrinne N10/N11: Strömung Einfuhrrinne N10/N11 OK
- NICHT Staumeldung Einfuhrrinne N10
- NICHT Staumeldung Einfuhrrinne N11
- Zeit 10sek ??

SCHRITT 8: Fertig
- Freigabe Start Einfuhr = RUHE`;

console.log('🧪 Starting parsing test with real Word document content...\n');

// Create parser instance
const parser = new EnhancedLogicParser(standardSyntaxRules);

try {
  // Parse the content
  const result = parser.parse(testContent);
  
  console.log('✅ Parsing completed successfully!\n');
  
  // Test step recognition
  console.log('📋 STEPS FOUND:');
  result.steps.forEach((step, index) => {
    console.log(`  ${index + 1}. ${step.type} ${step.number}: ${step.description}`);
    console.log(`     Entry conditions: ${step.entryConditions.length}`);
    if (step.entryConditions.length > 0) {
      step.entryConditions.forEach(group => {
        group.conditions.forEach(cond => {
          console.log(`       - ${cond.text} (${cond.operator}, negated: ${cond.negated})`);
        });
      });
    }
  });
  
  console.log('\n🔗 CROSS-REFERENCES:');
  if (result.statistics.crossReferences > 0) {
    parser.crossReferences.forEach((ref, key) => {
      console.log(`  - ${ref.description} → ${ref.program} SCHRITT ${ref.steps.join('+')}`);
    });
  } else {
    console.log('  No cross-references found');
  }
  
  console.log('\n⏰ TIMERS:');
  let timerCount = 0;
  result.steps.forEach(step => {
    step.entryConditions.forEach(group => {
      group.conditions.forEach(cond => {
        if (cond.isTimeCondition) {
          console.log(`  - ${cond.text} (${cond.timeValue} ${cond.timeUnit})`);
          timerCount++;
        }
      });
    });
  });
  if (timerCount === 0) {
    console.log('  No timers found');
  }
  
  console.log('\n📊 STATISTICS:');
  console.log(`  Total steps: ${result.statistics.totalSteps}`);
  console.log(`  RUST steps: ${result.statistics.rustSteps || 0}`);
  console.log(`  SCHRITT steps: ${result.statistics.schrittSteps || 0}`);
  console.log(`  Total conditions: ${result.statistics.totalConditions}`);
  console.log(`  Cross-references: ${result.statistics.crossReferences}`);
  console.log(`  Variables: ${result.statistics.totalVariables}`);
  
  console.log('\n🔍 VALIDATION RESULTS:');
  if (result.errors.length > 0) {
    console.log('  ERRORS:');
    result.errors.forEach(error => {
      console.log(`    - Line ${error.lineNumber}: ${error.message}`);
    });
  }
  
  if (result.warnings.length > 0) {
    console.log('  WARNINGS:');
    result.warnings.forEach(warning => {
      console.log(`    - Line ${warning.lineNumber}: ${warning.message}`);
    });
  }
  
  if (result.errors.length === 0 && result.warnings.length === 0) {
    console.log('  No errors or warnings found');
  }
  
} catch (error) {
  console.error('❌ Parsing failed:', error);
  console.error(error.stack);
}

console.log('\n🏁 Test completed.');