#!/usr/bin/env node
// Test ML integration in webapp parser

import { UnifiedTextParser } from './src/core/UnifiedTextParser.js';
import { defaultSyntaxRules } from './src/config/syntaxRules.js';

// Test sample with ML patterns
const testContent = `
SCHRITT 1 (Start Entleeren Formenlager)
    Freigabe Entleeren Formenlager=
    (Program SCHRITT 5+6)
    
SCHRITT 2 (Prüfung Formenlager leer)
    Start Kontrolle Position=
    
RUHE (Warten auf Startbedingungen)
    Aktuelle Position=
    3.3	O0x: Status Formenlagern  FB304	13
`;

console.log('🚀 Testing ML Integration in Webapp Parser\n');

// Initialize parser with ML-enhanced syntax rules
const parser = new UnifiedTextParser(defaultSyntaxRules);

// Parse test content
console.log('📝 Parsing test content with ML patterns...\n');
const result = parser.parse(testContent, 'manual', { source: 'ml-test' });

// Display results
console.log('✅ Parsing Results:');
console.log('Steps found:', result.steps?.length || 0);
console.log('Variables found:', result.variables?.length || 0);

// Display ML metrics if available
if (result.mlMetrics) {
    console.log('\n🧠 ML Training Integration Results:');
    console.log('Training Accuracy:', Math.round((result.mlMetrics.trainingAccuracy || 0) * 100) + '%');
    console.log('Total Examples Used:', (result.mlMetrics.totalExamples || 0).toLocaleString());
    console.log('Pattern Reduction:', Math.round((result.mlMetrics.unknownPatternReduction || 0) * 100) + '%');
    console.log('Enhanced Patterns:', {
        crossReferences: result.mlMetrics.enhancedPatterns?.crossReferences || 0,
        variables: result.mlMetrics.enhancedPatterns?.variables || 0
    });
}

// Test ML pattern detection specifically
console.log('\n🔍 ML Pattern Detection Test:');
let mlEnhancedItems = 0;

// Check steps for ML enhancement
result.steps?.forEach(step => {
    step.entryConditions?.forEach(conditionGroup => {
        conditionGroup.conditions?.forEach(condition => {
            if (condition.mlEnhanced) {
                mlEnhancedItems++;
                console.log(`✨ ML Enhanced Condition: ${condition.originalLine} (confidence: ${condition.mlConfidence})`);
            }
        });
    });
});

// Check variables for ML enhancement
result.variables?.forEach(variable => {
    if (variable.mlEnhanced) {
        mlEnhancedItems++;
        console.log(`✨ ML Enhanced Variable: ${variable.originalLine} (confidence: ${variable.mlConfidence})`);
    }
});

console.log(`\n📊 Total ML Enhanced Items: ${mlEnhancedItems}`);

if (mlEnhancedItems > 0) {
    console.log('\n🎉 SUCCESS: ML patterns are working in webapp!');
} else {
    console.log('\n⚠️  ML patterns may need adjustment - check pattern matching');
}

console.log('\n🚀 ML Integration Test Complete');