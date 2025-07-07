// src/core/parser.jsx - Schone, werkende versie
export function parseStandaardwerk(code, syntaxRules) {
  console.log('=== PARSING STANDAARDWERK ===');
  console.log('Input code:', code);
  
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
  let currentVariable = null;
  let pendingConditions = [];

  // Helper: detecteer variabele type
  const detectVariableType = (name) => {
    if (!name) return 'variable';
    const lowerName = name.toLowerCase();

    if (syntaxRules.variableDetection.storingKeywords.some(keyword =>
        lowerName.includes(keyword.toLowerCase()))) {
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

  // Helper: parse voorwaarde
  const parseCondition = (line, lineNumber) => {
    let conditionText = line.trim();
    
    // Detecteer OR
    const isOr = conditionText.startsWith('+ ');
    if (isOr) {
      conditionText = conditionText.substring(2).trim();
    }

    // Detecteer negatie
    const isNegated = /^(NIET|NOT|NICHT)\s+/i.test(conditionText);
    if (isNegated) {
      conditionText = conditionText.replace(/^(NIET|NOT|NICHT)\s+/i, '').trim();
    }

    // Detecteer externe referenties
    const hasExternalRef = /\([^)]*\s+(FB|FC)\d+[^)]*\)/i.test(conditionText);
    if (hasExternalRef) {
      result.statistics.externalReferences++;
    }

    // Detecteer tijd
    const timeMatch = conditionText.match(/(?:TIJD|ZEIT|TIME)\s*~?\s*(\d+)\s*(Sek|Min|s|m)/i);
    const isTimeCondition = !!timeMatch;

    // Detecteer vergelijkingen
    const comparisonMatch = conditionText.match(/^([a-zA-Z0-9_.\[\]]+)\s*(==|!=|<>|>=|<=|>|<)\s*(.+)$/);
    let comparisonData = null;
    if (comparisonMatch) {
      comparisonData = {
        variable: comparisonMatch[1].trim(),
        operator: comparisonMatch[2],
        value: comparisonMatch[3].trim().replace(/["']/g, '')
      };
    }

    return {
      text: conditionText,
      negated: isNegated,
      hasExternalRef: hasExternalRef,
      isTimeCondition: isTimeCondition,
      hasComparison: !!comparisonData,
      comparison: comparisonData,
      lineNumber,
      operator: isOr ? 'OR' : 'AND',
      originalLine: line.trim()
    };
  };

  // Helper: finaliseer stap
  const finalizeCurrentStep = () => {
    if (currentStep && pendingConditions.length > 0) {
      // Groepeer voorwaarden
      const conditionGroups = [];
      let currentGroup = [];

      for (const condition of pendingConditions) {
        if (condition.operator === 'OR' && currentGroup.length > 0) {
          conditionGroups.push({ type: 'group', operator: 'AND', conditions: currentGroup });
          currentGroup = [condition];
        } else {
          currentGroup.push(condition);
        }
      }

      if (currentGroup.length > 0) {
        conditionGroups.push({ type: 'group', operator: 'AND', conditions: currentGroup });
      }

      currentStep.transitionConditions = conditionGroups;
      pendingConditions = [];
    }
  };

  // Helper: finaliseer variabele
  const finalizeCurrentVariable = () => {
    if (currentVariable && pendingConditions.length > 0) {
      currentVariable.conditions = [...pendingConditions];
      pendingConditions = [];
    }
  };

  // Helper: check of regel ingesprongen is
  const isIndented = (line) => /^\s/.test(line);

  // Process alle regels
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      finalizeCurrentStep();
      finalizeCurrentVariable();
      return;
    }

    // Parse program header
    if (!result.programName && !isIndented(line)) {
      const headerMatch = line.match(/^(.+?)\s+(FB\d+)$/);
      if (headerMatch) {
        result.programName = headerMatch[1].trim();
        result.functionBlock = headerMatch[2].trim();
      } else if (!line.includes(':')) {
        result.programName = line.trim();
      }
      return;
    }

    // Parse Symbolik IDB
    if (line.startsWith('Symbool IDB:') || line.startsWith('Symbolik IDB:')) {
      const colonIndex = line.indexOf(':');
      if (colonIndex >= 0) {
        result.symbolikIDB = line.substring(colonIndex + 1).trim();
      }
      return;
    }

    // Parse variabele definities
    const variableMatch = line.match(/^([A-Za-z][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (variableMatch && !isIndented(line)) {
      finalizeCurrentStep();
      finalizeCurrentVariable();

      const varName = variableMatch[1];
      const varValue = variableMatch[2].trim();

      currentVariable = {
        name: varName,
        type: detectVariableType(varName),
        value: varValue || undefined,
        conditions: [],
        lineNumber
      };

      if (currentVariable.type === 'timer') {
        result.timers.push(currentVariable);
      } else if (currentVariable.type === 'marker') {
        result.markers.push(currentVariable);
      } else if (currentVariable.type === 'storing') {
        result.storingen.push(currentVariable);
      } else {
        result.variables.push(currentVariable);
      }
      return;
    }

    // Parse stappen
    const stepPattern = new RegExp(`^(${syntaxRules.stepKeywords.rest.join('|')}|${syntaxRules.stepKeywords.step.join('|')})(?:\\s+(\\d+))?:\\s*(.*)$`, 'i');
    const stepMatch = trimmedLine.match(stepPattern);

    if (stepMatch && !isIndented(line)) {
      finalizeCurrentStep();
      finalizeCurrentVariable();

      const type = syntaxRules.stepKeywords.rest.some(k =>
        k.toLowerCase() === stepMatch[1].toLowerCase()) ? 'RUST' : 'STAP';

      currentStep = {
        type: type,
        number: type === 'RUST' ? 0 : parseInt(stepMatch[2]) || 0,
        description: stepMatch[3] || '',
        transitionConditions: [],
        lineNumber,
        timers: [],
        markers: [],
        storingen: []
      };
      
      console.log(`Found step: ${type} ${currentStep.number} - ${currentStep.description}`);
      result.steps.push(currentStep);
      return;
    }

    // Parse voorwaarden (ingesprongen)
    if (isIndented(line) && (currentStep || currentVariable)) {
      const condition = parseCondition(line, lineNumber);
      
      // Detecteer variabelen in voorwaarde
      if (currentStep) {
        const condText = condition.text.toLowerCase();
        
        // Timer detectie
        if (condition.isTimeCondition || syntaxRules.variableDetection.timerKeywords.some(kw => 
            condText.includes(kw.toLowerCase()))) {
          const timerName = condition.text.match(/([A-Za-z0-9_]+)/)?.[1] || 'Timer';
          if (!currentStep.timers.includes(timerName)) {
            currentStep.timers.push(timerName);
          }
        }
        
        // Marker detectie
        if (syntaxRules.variableDetection.markerKeywords.some(kw => 
            condText.includes(kw.toLowerCase()))) {
          const markerName = condition.text.match(/([A-Za-z0-9_]+)/)?.[1] || 'Marker';
          if (!currentStep.markers.includes(markerName)) {
            currentStep.markers.push(markerName);
          }
        }
        
        // Storing detectie
        if (syntaxRules.variableDetection.storingKeywords.some(kw => 
            condText.includes(kw.toLowerCase()))) {
          const storingName = condition.text.match(/([A-Za-z0-9_]+)/)?.[1] || 'Storing';
          if (!currentStep.storingen.includes(storingName)) {
            currentStep.storingen.push(storingName);
          }
        }
      }

      pendingConditions.push(condition);
      result.statistics.totalConditions++;
    }
  });

  // Finaliseer laatste items
  finalizeCurrentStep();
  finalizeCurrentVariable();

  // Update statistieken
  result.statistics.totalSteps = result.steps.length;
  result.statistics.totalVariables = result.variables.length + result.timers.length +
                                     result.markers.length + result.storingen.length;
  result.statistics.complexityScore = Math.round(
    result.statistics.totalSteps * 2 +
    result.statistics.totalConditions * 1.5 +
    result.statistics.totalVariables * 1.2 +
    result.statistics.externalReferences * 3
  );

  console.log('=== PARSE RESULT ===');
  console.log('Steps found:', result.steps.length);
  console.log('Variables found:', result.variables.length);
  console.log('Timers found:', result.timers.length);
  console.log('Markers found:', result.markers.length);
  console.log('Storingen found:', result.storingen.length);

  return result;
}