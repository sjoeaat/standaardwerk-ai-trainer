// =====================================================================
// src/core/parser.jsx - FIXED CLEAN PARSER VERSION
// =====================================================================
// Deze versie herstelt de correcte parsing logica voor Word import
// en lost de problemen op met stap herkenning en voorwaarde toewijzing
// =====================================================================

export function parseStandaardwerk(code, syntaxRules) {
    console.log('🚀 Parser gestart met syntax rules:', syntaxRules);
    
    const lines = code.split('\n');
    const result = {
      programName: '',
      functionBlock: '',
      symbolikIDB: '',
      steps: [],
      variables: [],
      timers: [],
      markers: [],
      storingen: [],
      errors: [],
      warnings: [],
      statistics: {
        totalSteps: 0,
        totalConditions: 0,
        totalVariables: 0,
        externalReferences: 0,
        complexityScore: 0
      }
    };
  
    let currentStep = null;
    let pendingConditions = [];
    let currentVariableDefinition = null;
  
    // Helper functie voor variabele type detectie
    const detectVariableType = (name) => {
      if (!name) return 'variable';
      const lowerName = name.toLowerCase();
  
      if (syntaxRules.variableDetection.storingKeywords.some(keyword =>
          lowerName.startsWith(keyword.toLowerCase()))) {
        return 'storing';
      }
  
      if (syntaxRules.variableDetection.timerKeywords.some(keyword =>
          lowerName.includes(keyword.toLowerCase()))) {
        return 'timer';
      }
  
      if (syntaxRules.variableDetection.markerKeywords.some(keyword =>
          lowerName.includes(keyword.toLowerCase()))) {
        return 'marker';
      }
  
      return 'variable';
    };
  
    // Helper functie om te checken of een regel ingesprongen is
    const isIndented = (line) => /^\s/.test(line);
  
    // Helper functie om voorwaarden aan een stap toe te voegen
    const addConditionsToStep = (step, conditions) => {
      if (!step || conditions.length === 0) return;
      
      console.log(`📝 Voorwaarden toevoegen aan ${step.type} ${step.number}:`, conditions.map(c => c.text));
      
      // Voeg voorwaarden toe aan step.conditions array (voor display)
      step.conditions = step.conditions || [];
      conditions.forEach(cond => {
        step.conditions.push(cond.text);
      });
      
      // Ook toevoegen aan transitionConditions voor compatibiliteit
      if (conditions.length > 0) {
        step.transitionConditions = [{
          type: 'group',
          operator: 'AND',
          conditions: [...conditions]
        }];
      }
    };
  
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();
  
      console.log(`Regel ${lineNumber}: "${line}" (ingesprongen: ${isIndented(line)})`);
  
      if (!trimmedLine) {
        // Lege regel - save pending conditions
        if (currentStep && pendingConditions.length > 0) {
          addConditionsToStep(currentStep, pendingConditions);
          pendingConditions = [];
        }
        if (pendingConditions.length > 0 && currentVariableDefinition) {
          currentVariableDefinition.conditions = [...pendingConditions];
          pendingConditions = [];
        }
        return;
      }
  
      // Parse program header (eerste niet-lege regel, niet ingesprongen)
      if (!result.programName && !isIndented(line)) {
        const headerMatch = line.match(/^(.+?)\s+(FB\d+)$/);
        if (headerMatch) {
          result.programName = headerMatch[1].trim();
          result.functionBlock = headerMatch[2].trim();
          console.log(`✅ Program header gevonden: ${result.programName} ${result.functionBlock}`);
        } else if (!line.includes(':')) {
          result.programName = line.trim();
          console.log(`✅ Program naam gevonden: ${result.programName}`);
        }
        return;
      }
  
      // Parse Symbolik IDB
      if (line.match(/^(Symbool|Symbolik)\s+IDB\s*:/i)) {
        const colonIndex = line.indexOf(':');
        if (colonIndex >= 0) {
          result.symbolikIDB = line.substring(colonIndex + 1).trim();
          console.log(`✅ Symbolik IDB gevonden: ${result.symbolikIDB}`);
        }
        return;
      }
  
      // Check eerst of dit een stap is voordat we naar variabelen kijken
      const stepKeywords = [...syntaxRules.stepKeywords.rest, ...syntaxRules.stepKeywords.step];
      
      // Detecteer RUST of STAP
      let isStepLine = false;
      let stepMatch = null;
      
      // Check voor RUST patroon
      for (const rustKeyword of syntaxRules.stepKeywords.rest) {
        const rustRegex = new RegExp(`^${rustKeyword}\\s*:?\\s*(.*)$`, 'i');
        const match = trimmedLine.match(rustRegex);
        if (match) {
          stepMatch = [match[0], rustKeyword, null, match[1]];
          isStepLine = true;
          break;
        }
      }
      
      // Check voor STAP patroon (alleen als geen RUST gevonden)
      if (!isStepLine) {
        for (const stepKeyword of syntaxRules.stepKeywords.step) {
          const stepRegex = new RegExp(`^${stepKeyword}\\s+(\\d+)\\s*:?\\s*(.*)$`, 'i');
          const match = trimmedLine.match(stepRegex);
          if (match) {
            stepMatch = [match[0], stepKeyword, match[1], match[2]];
            isStepLine = true;
            break;
          }
        }
      }
  
      if (isStepLine && stepMatch) {
        // Save pending conditions voor vorige stap
        if (currentStep && pendingConditions.length > 0) {
          addConditionsToStep(currentStep, pendingConditions);
          pendingConditions = [];
        }
  
        const keyword = stepMatch[1];
        const isRust = syntaxRules.stepKeywords.rest.some(k =>
          k.toLowerCase() === keyword.toLowerCase());
        
        const type = isRust ? 'RUST' : 'STAP';
        const number = type === 'RUST' ? 0 : (parseInt(stepMatch[2]) || 0);
        const description = stepMatch[3] || '';
  
        currentStep = {
          type: type,
          number: number,
          description: description,
          conditions: [],
          transitionConditions: [],
          lineNumber,
          timers: [],
          markers: [],
          storingen: []
        };
        
        console.log(`✅ ${type} gevonden: ${number} - ${description}`);
        result.steps.push(currentStep);
        return;
      }
  
      // Parse variabele definities (alleen als het geen stap is)
      const variableMatch = line.match(/^([A-Za-z][A-Za-z0-9_]*)\s*=/);
      if (variableMatch && !isIndented(line) && !isStepLine) {
        if (currentVariableDefinition && pendingConditions.length > 0) {
          currentVariableDefinition.conditions = [...pendingConditions];
        }
  
        currentVariableDefinition = {
          name: variableMatch[1],
          type: detectVariableType(variableMatch[1]),
          conditions: [],
          lineNumber
        };
  
        console.log(`✅ Variabele definitie gevonden: ${currentVariableDefinition.name} (type: ${currentVariableDefinition.type})`);
  
        if (currentVariableDefinition.type === 'timer') {
          result.timers.push(currentVariableDefinition);
        } else if (currentVariableDefinition.type === 'marker') {
          result.markers.push(currentVariableDefinition);
        } else if (currentVariableDefinition.type === 'storing') {
          result.storingen.push(currentVariableDefinition);
        } else {
          result.variables.push(currentVariableDefinition);
        }
  
        pendingConditions = [];
        return;
      }
  
      // Parse voorwaarden (ingesprongen regels onder een stap of variabele)
      if (isIndented(line) && (currentStep || currentVariableDefinition)) {
        let conditionText = trimmedLine;
        
        // Check voor OR operator
        const isOr = conditionText.startsWith('+ ');
        if (isOr) {
          conditionText = conditionText.substring(2).trim();
        }
  
        // Check voor negatie
        const isNegated = /^(NIET|NOT|NICHT)\s+/i.test(conditionText);
        if (isNegated) {
          conditionText = conditionText.replace(/^(NIET|NOT|NICHT)\s+/i, '').trim();
        }
  
        // Check voor externe referenties
        const hasExternalRef = /\*([^*]+)\*/.test(conditionText);
        if (hasExternalRef) {
          result.statistics.externalReferences++;
        }
  
        // Check voor tijd voorwaarden
        const timeMatch = conditionText.match(/(?:TIJD|ZEIT|TIME)\s*~\s*(\d+)\s*(Sek|Min|s|m)/i);
        const isTimeCondition = !!timeMatch;
  
        // Check voor vergelijkingen
        const comparisonMatch = conditionText.match(/^([a-zA-Z0-9_.\[\]]+)\s*(==|!=|<>|>=|<=|>|<)\s*(.+)$/);
        let comparisonData = null;
        if (comparisonMatch) {
          comparisonData = {
            variable: comparisonMatch[1].trim(),
            operator: comparisonMatch[2],
            value: comparisonMatch[3].trim().replace(/["']/g, '')
          };
        }
  
        // Detecteer gebruik van variabelen in deze voorwaarde
        if (currentStep) {
          syntaxRules.variableDetection.timerKeywords.forEach(keyword => {
            if (conditionText.toLowerCase().includes(keyword.toLowerCase())) {
              currentStep.timers.push(conditionText);
            }
          });
          
          syntaxRules.variableDetection.markerKeywords.forEach(keyword => {
            if (conditionText.toLowerCase().includes(keyword.toLowerCase())) {
              currentStep.markers.push(conditionText);
            }
          });
          
          syntaxRules.variableDetection.storingKeywords.forEach(keyword => {
            if (conditionText.toLowerCase().includes(keyword.toLowerCase())) {
              currentStep.storingen.push(conditionText);
            }
          });
        }
  
        const condition = {
          text: conditionText,
          negated: isNegated,
          hasExternalRef: hasExternalRef,
          isTimeCondition: isTimeCondition,
          hasComparison: !!comparisonData,
          comparison: comparisonData,
          lineNumber,
          operator: isOr ? 'OR' : 'AND'
        };
  
        console.log(`  ↳ Voorwaarde: ${isNegated ? 'NIET ' : ''}${conditionText} (${condition.operator})`);
        
        pendingConditions.push(condition);
        result.statistics.totalConditions++;
      }
    });
  
    // Verwerk laatste pending conditions
    if (currentStep && pendingConditions.length > 0) {
      addConditionsToStep(currentStep, pendingConditions);
    }
    
    if (currentVariableDefinition && pendingConditions.length > 0) {
      currentVariableDefinition.conditions = [...pendingConditions];
    }
  
    // Bereken statistieken
    result.statistics.totalSteps = result.steps.length;
    result.statistics.totalVariables = result.variables.length + result.timers.length +
                                       result.markers.length + result.storingen.length;
    result.statistics.complexityScore = Math.round(
      result.statistics.totalSteps * 2 +
      result.statistics.totalConditions * 1.5 +
      result.statistics.totalVariables * 1.2 +
      result.statistics.externalReferences * 3
    );
  
    console.log('✅ Parsing compleet:', {
      stappen: result.steps.length,
      variabelen: result.statistics.totalVariables,
      voorwaarden: result.statistics.totalConditions
    });
  
    return result;
  }