// =====================================================================
// src/core/parser.jsx - ENHANCED VERSION (TAB/SPATIE INSPECTIE FIXED)
// =====================================================================

export function parseStandaardwerk(code, syntaxRules) {
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

  const isIndented = (line) => /^\s/.test(line); // tab of spatie detectie

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmedLine = line.trim();

    if (!trimmedLine) {
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
    const variableMatch = line.match(/^([A-Za-z][A-Za-z0-9_]*)\s*=/);
    if (variableMatch && !isIndented(line)) {
      if (currentVariableDefinition && pendingConditions.length > 0) {
        currentVariableDefinition.conditions = [...pendingConditions];
      }

      currentVariableDefinition = {
        name: variableMatch[1],
        type: detectVariableType(variableMatch[1]),
        conditions: [],
        lineNumber
      };

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

    // Parse stappen: RUST of STAP
    const stepPattern = new RegExp(`^(${syntaxRules.stepKeywords.rest.join('|')}|${syntaxRules.stepKeywords.step.join('|')})(?:\\s+(\\d+))?:\\s*(.*)$`, 'i');
    const stepMatch = trimmedLine.match(stepPattern);

    if (stepMatch) {
      if (currentStep && pendingConditions.length > 0) {
        currentStep.transitionConditions = [{
          type: 'group',
          operator: 'AND',
          conditions: [...pendingConditions]
        }];
        pendingConditions = [];
      }

      const type = syntaxRules.stepKeywords.rest.some(k =>
        k.toLowerCase() === stepMatch[1].toLowerCase()) ? 'RUST' : 'STAP';

      currentStep = {
        type: type,
        number: type === 'RUST' ? 0 : parseInt(stepMatch[2]) || 0,
        description: stepMatch[3] || '',
        transitionConditions: [],
        lineNumber,
      };
      result.steps.push(currentStep);
      return;
    }

    // Parse voorwaarden
    if (currentStep || currentVariableDefinition) {
      let conditionText = line.trim();
      const isOr = conditionText.startsWith('+ ');
      if (isOr) {
        conditionText = conditionText.substring(2).trim();
      }

      const isNegated = /^(NIET|NOT|NICHT)\s+/i.test(conditionText);
      if (isNegated) {
        conditionText = conditionText.replace(/^(NIET|NOT|NICHT)\s+/i, '').trim();
      }

      const hasExternalRef = /\*([^*]+)\*/.test(conditionText);
      if (hasExternalRef) {
        result.statistics.externalReferences++;
      }

      const timeMatch = conditionText.match(/(?:TIJD|ZEIT|TIME)\s*~\s*(\d+)\s*(Sek|Min|s|m)/i);
      const isTimeCondition = !!timeMatch;

      const comparisonMatch = conditionText.match(/^([a-zA-Z0-9_.\[\]]+)\s*(==|!=|<>|>=|<=|>|<)\s*(.+)$/);
      let comparisonData = null;
      if (comparisonMatch) {
        comparisonData = {
          variable: comparisonMatch[1].trim(),
          operator: comparisonMatch[2],
          value: comparisonMatch[3].trim().replace(/["']/g, '')
        };
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

      if (currentStep) {
        if (isOr && currentStep.transitionConditions.length > 0) {
          currentStep.transitionConditions.push({
            type: 'group',
            operator: 'OR',
            conditions: [condition]
          });
        } else if (currentStep.transitionConditions.length === 0) {
          currentStep.transitionConditions.push({
            type: 'group',
            operator: 'AND',
            conditions: [condition]
          });
        } else {
          const lastGroup = currentStep.transitionConditions[currentStep.transitionConditions.length - 1];
          lastGroup.conditions.push(condition);
        }
        result.statistics.totalConditions++;
      } else if (currentVariableDefinition) {
        pendingConditions.push(condition);
      }
    }
  });

  if (currentVariableDefinition && pendingConditions.length > 0) {
    currentVariableDefinition.conditions = [...pendingConditions];
  }

  result.statistics.totalSteps = result.steps.length;
  result.statistics.totalVariables = result.variables.length + result.timers.length +
                                     result.markers.length + result.storingen.length;
  result.statistics.complexityScore = Math.round(
    result.statistics.totalSteps * 2 +
    result.statistics.totalConditions * 1.5 +
    result.statistics.totalVariables * 1.2 +
    result.statistics.externalReferences * 3
  );

  return result;
}
