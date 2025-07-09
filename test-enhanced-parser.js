#!/usr/bin/env node
// Test script for Enhanced Parser

import { EnhancedParser } from './src/core/EnhancedParser.js';
import { DEFAULT_VALIDATION_RULES } from './src/config/validationRules.js';

// Test data from test-real-parsing.html
const testContent = `Hauptprogramm Einfuhr FB100
Symbolik IDB: Haupt_Einfuhr

RUHE: Hauptprogramm Einfuhr
Freigabe Start Einfuhr
DT Start Einfuhr

SCHRITT 1: Selektiere 1e zu füllen Horde
Horde vorselektiert (Selektionsprogramm Horde für Einfuhr SCHRITT 2+5+8+11)

SCHRITT 2: Warten bis Horde und Einfuhrwagen bereit für Füllen
Füllen 1e Horde aktiv:
  Füllen Horde aktiv (Füllen Horde N21 SCHRITT 7)
  + Füllen Horde aktiv (Füllen Horde N22 SCHRITT 7)
  + Füllen Horde aktiv (Füllen Horde N23 SCHRITT 7)
  + Füllen Horde aktiv (Füllen Horde N24 SCHRITT 7)

SCHRITT 3: Produktion
DT Ende Einfuhr
+Ende Produktion (K5 in Ruhe) (Komm. von K5)

SCHRITT 4: Start leerdrehen Einfuhrinne N10/N11
Strömung Einfuhrrinne N10/N11: Strömung Einfuhrrinne N10/N11 OK
NICHT Staumeldung Einfuhrrinne N10
NICHT Staumeldung Einfuhrrinne N11
Zeit 10sek ??

SCHRITT 8: Fertig
Freigabe Start Einfuhr = RUHE`;

async function testEnhancedParser() {
  console.log('🧪 Testing Enhanced Parser...');
  console.log('');
  
  // Initialize parser
  const parser = new EnhancedParser({}, DEFAULT_VALIDATION_RULES);
  
  // Parse the test content
  const result = parser.parseText(testContent);
  
  console.log('📊 Parsing Results:');
  console.log(`  Steps: ${result.steps.length}`);
  console.log(`  Variables: ${result.variables.length}`);
  console.log(`  Conditions: ${result.conditions.length}`);
  console.log(`  Cross-references: ${result.crossReferences.length}`);
  console.log(`  Errors: ${result.errors.length}`);
  console.log(`  Warnings: ${result.warnings.length}`);
  console.log('');
  
  // Show detailed results
  console.log('🎯 Steps Found:');
  result.steps.forEach((step, index) => {
    console.log(`  ${index + 1}. ${step.type} ${step.number}: ${step.description}`);
    if (step.conditions && step.conditions.length > 0) {
      console.log(`     Conditions: ${step.conditions.length}`);
      step.conditions.forEach((condition, condIndex) => {
        let markers = [];
        if (condition.negated) markers.push('NEG');
        if (condition.operator === 'OR') markers.push('OR');
        if (condition.crossReference) markers.push('CROSS-REF');
        if (condition.timer) markers.push('TIMER');
        if (condition.assignment) markers.push('ASSIGN');
        
        console.log(`     ${condIndex + 1}. ${condition.text} [${markers.join(', ')}]`);
      });
    }
  });
  
  console.log('');
  console.log('🔗 Cross-references:');
  result.crossReferences.forEach((crossRef, index) => {
    console.log(`  ${index + 1}. ${crossRef.description} → ${crossRef.program} SCHRITT ${crossRef.steps.join('+')}`);
  });
  
  console.log('');
  console.log('⏱️ Timers:');
  result.conditions.filter(c => c.timer).forEach((condition, index) => {
    console.log(`  ${index + 1}. ${condition.timer.value}${condition.timer.unit} → ${condition.text}`);
  });
  
  console.log('');
  console.log('📈 Parser Metrics:');
  const metrics = parser.getMetrics();
  console.log(`  Parsing efficiency: ${(metrics.parsingEfficiency * 100).toFixed(1)}%`);
  console.log(`  Cross-references: ${metrics.crossReferences}`);
  console.log(`  Timers: ${metrics.timers}`);
  console.log(`  Parse errors: ${metrics.parseErrors}`);
  
  console.log('');
  console.log('🎓 Training Data Summary:');
  const trainingData = parser.exportTrainingData();
  console.log(`  Step examples: ${trainingData.trainingData.step?.length || 0}`);
  console.log(`  Condition examples: ${trainingData.trainingData.condition?.length || 0}`);
  console.log(`  Variable examples: ${trainingData.trainingData.variable?.length || 0}`);
  console.log(`  Unknown examples: ${trainingData.trainingData.unknown?.length || 0}`);
  
  // Test training data loading
  console.log('');
  console.log('🔧 Testing Training Data Enhancement...');
  
  const mockTrainingData = {
    bestSuggestions: [
      {
        suggestedGroup: 'hulpmerker',
        examples: ['Freigabe Start Einfuhr =', 'DT Start Einfuhr ='],
        confidence: 0.8,
        frequency: 2
      },
      {
        suggestedGroup: 'cross_reference',
        examples: ['(Füllen Horde N21 SCHRITT 7)', '(Selektionsprogramm Horde für Einfuhr SCHRITT 2+5+8+11)'],
        confidence: 0.9,
        frequency: 5
      }
    ]
  };
  
  parser.loadTrainingData(mockTrainingData);
  console.log('✅ Training data loaded successfully');
  
  return result;
}

// Run the test
testEnhancedParser().catch(console.error);