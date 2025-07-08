import { UnifiedTextParser } from './src/core/UnifiedTextParser.js';
import { readFileSync } from 'fs';
import { defaultSyntaxRules } from './src/config/syntaxRules.js';

const text = readFileSync('./test-ideal-sample.txt', 'utf8');
console.log('=== TESTING IDEAL SAMPLE ===');
console.log('Input text:');
console.log(text);
console.log('\n=== PARSING RESULT ===');

const parser = new UnifiedTextParser(defaultSyntaxRules);
const result = parser.parse(text, 'manual', { language: 'German' });

console.log('\nSteps found:', result.steps.length);
result.steps.forEach((step, i) => {
  console.log(`\nStep ${i+1}: ${step.type} ${step.number} - "${step.description}"`);
  console.log(`  Entry conditions (${step.entryConditions.length} groups):`);
  step.entryConditions.forEach((group, j) => {
    console.log(`    Group ${j+1}: ${group.operator} (${group.conditions.length} conditions)`);
    group.conditions.forEach(cond => {
      console.log(`      - ${cond.isNot ? 'NOT ' : ''}${cond.variable}`);
    });
  });
});

console.log('\nVariables found:', result.variables.length);
result.variables.forEach((variable, i) => {
  console.log(`Variable ${i+1}: ${variable.name} (${variable.type}) = ${variable.value || 'undefined'}`);
});

console.log('\nErrors:', result.errors.length);
result.errors.forEach(error => console.log(`  - ${error.type}: ${error.message}`));

console.log('\nWarnings:', result.warnings.length);
result.warnings.forEach(warning => console.log(`  - ${warning.type}: ${warning.message}`));