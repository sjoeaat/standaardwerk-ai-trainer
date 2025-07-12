#!/usr/bin/env node
// Test correct hierarchy: conditions ABOVE step, step with TAB

import { EnhancedLogicParser } from './src/core/EnhancedLogicParser.js';
import { defaultSyntaxRules } from './src/config/syntaxRules.js';

// Test content with CORRECT hierarchy
const testContent = `
Start knop ingedrukt
Veiligheidsdeuren gesloten
Geen actieve storingen
	RUST (Wachten op start signaal)

Doseerklep.Gesloten  
Tank.Niveau > 20%
	SCHRITT 1 (Initialiseren systeem)
	SETZEN Motorstart = TRUE
	TIJD T#5s

Motor.Running
Temperatuur < 50
	SCHRITT 2 (Product doseren)
	STORING 23 = Doseerklep vastgelopen
	Teller1 = 5
`;

console.log('🧪 Testing Correct Hierarchy Parser\n');
console.log('📋 Input structure:');
console.log('- Conditions: NO tab (above step)');
console.log('- Steps: WITH tab indentation');
console.log('- NO dash (-) prefix\n');

const parser = new EnhancedLogicParser(defaultSyntaxRules);
const result = parser.parse(testContent);

console.log('\n✅ Parsing Results:\n');

// Display each step with its conditions
result.steps.forEach(step => {
  console.log(`\n${step.type} ${step.number || ''}: ${step.description}`);
  
  console.log('  Debug - entryConditions:', step.entryConditions);
  
  if (step.entryConditions && step.entryConditions.length > 0) {
    console.log('  Entry Conditions:');
    step.entryConditions.forEach(group => {
      if (group.conditions) {
        group.conditions.forEach(cond => {
          const prefix = cond.operator === 'OR' ? '  + ' : '    ';
          const negation = cond.negated ? 'NIET ' : '';
          console.log(`${prefix}${negation}${cond.text}`);
        });
      }
    });
  } else {
    console.log('  (No entry conditions)');
  }
  
  // Show variables/timers within step
  if (step.timers && step.timers.length > 0) {
    console.log('  Timers:');
    step.timers.forEach(timer => {
      console.log(`    ${timer.name || 'TIJD'} = ${timer.value}`);
    });
  }
  
  if (step.storingen && step.storingen.length > 0) {
    console.log('  Storingen:');
    step.storingen.forEach(storing => {
      console.log(`    STORING ${storing.number} = ${storing.description}`);
    });
  }
});

console.log('\n📊 Summary:');
console.log(`Total steps: ${result.steps.length}`);
console.log(`Total conditions: ${result.statistics.totalConditions || 0}`);

// Check if hierarchy is correct
let hierarchyCorrect = true;
result.steps.forEach(step => {
  if (step.entryConditions && step.entryConditions.length > 0) {
    console.log(`\n✅ ${step.type} ${step.number} has ${step.entryConditions[0].conditions.length} entry conditions`);
  } else if (step.type !== 'RUST') {
    console.log(`\n⚠️  ${step.type} ${step.number} has NO entry conditions`);
    hierarchyCorrect = false;
  }
});

if (hierarchyCorrect) {
  console.log('\n🎉 SUCCESS: Parser correctly handles conditions ABOVE steps!');
} else {
  console.log('\n⚠️  Some steps missing conditions - check parser logic');
}

console.log('\n🏁 Test Complete');