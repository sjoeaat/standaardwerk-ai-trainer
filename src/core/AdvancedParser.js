// =====================================================================
// src/core/AdvancedParser.js - Advanced Parser for Industrial Programs
// =====================================================================
// Addresses the gaps identified in the analysis:
// - Hierarchical FB program structure
// - Variable assignments and complex matrix operations
// - Compound OR-blocks and grouped conditions
// - Comment and description extraction
// - Standardized entity normalization
// =====================================================================

import { FlexibleParser } from './FlexibleParser.js';

/**
 * Advanced Parser for complex industrial program structures
 */
export class AdvancedParser extends FlexibleParser {
  constructor(syntaxRules = {}, validationRules = {}) {
    super(syntaxRules, validationRules);
    
    // Enhanced patterns for advanced parsing
    this.advancedPatterns = {
      // FB program headers
      fbProgram: /^(Hauptprogramm|Unterprogramm|Programm)\s+([A-Za-z0-9_\s]+)\s+(FB\d+)$/i,
      
      // Variable assignments (simple and complex)
      simpleAssignment: /^([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]+)\)\s*=\s*(.+)$/,
      complexAssignment: /^([A-Za-z_][A-Za-z0-9_]*)\[([^\]]+)\]\.([A-Za-z_][A-Za-z0-9_]*)\[([^\]]+)\]\.([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/,
      matrixAssignment: /^([A-Za-z_][A-Za-z0-9_]*)\[([^\]]+)\]\.([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/,
      
      // Comments and descriptions
      singleLineComment: /^\/\/\s*(.*)$/,
      multiLineComment: /^\/\*\s*(.*?)\s*\*\/$/,
      inlineComment: /^(.+?)\s*\/\/\s*(.*)$/,
      descriptionBlock: /^([A-Za-z_][A-Za-z0-9_\s]*):?\s*(.+)$/,
      
      // Standardized references
      fbStepReference: /^(.+?)\s*\(([A-Za-z0-9_\s]+)\s+(FB\d+)\s+(SCHRITT|STAP|STEP)\s+([0-9+]+)\)\s*$/i,
      standardizedReference: /^(.+?)\s*\(([A-Za-z0-9_\s]+)\s+(SCHRITT|STAP|STEP)\s+([0-9+]+)\)\s*$/i,
      
      // Compound conditions
      orBlockStart: /^\s*\[\s*$/,
      orBlockEnd: /^\s*\]\s*$/,
      orBlockItem: /^\s*([A-Za-z_][A-Za-z0-9_\s]*)\s*\+?\s*$/,
      
      // Entity types
      käseZähler: /^(Käsezähler|Cheese Counter)\s+([A-Za-z0-9_\s]+)\s*(.*)$/i,
      störung: /^(Störung|Fault|Error)\s*[:.]?\s*(.+)$/i,
      freigabe: /^(Freigabe|Release|Enable)\s+(.+)$/i,
      
      // Comparisons and evaluations
      comparison: /^(.+?)\s*([<>=!]+)\s*(.+)$/,
      evaluation: /^(.+?)\s*(ist|is|==)\s*(.+)$/i
    };
    
    // Program structure tracking
    this.programStructure = {
      currentFB: null,
      fbHierarchy: new Map(),
      crossReferences: new Map(),
      entities: new Map()
    };
  }

  /**
   * Parse text with advanced structure detection
   */
  parseText(text, options = {}) {
    // First, run the base FlexibleParser
    const baseResult = super.parseText(text, options);
    
    // Then enhance with advanced parsing
    const enhancedResult = this.enhanceWithAdvancedParsing(text, baseResult);
    
    return enhancedResult;
  }

  /**
   * Enhance base parsing with advanced features
   */
  enhanceWithAdvancedParsing(text, baseResult) {
    const lines = text.split('\n');
    const enhanced = {
      ...baseResult,
      programs: [],
      variableAssignments: [],
      comments: [],
      orBlocks: [],
      entities: [],
      normalizedReferences: [],
      compoundConditions: []
    };

    let currentProgram = null;
    let currentOrBlock = null;
    let lineIndex = 0;

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // 1. Detect FB program headers
      const programMatch = this.detectFBProgram(trimmed, index + 1);
      if (programMatch) {
        if (currentProgram) {
          enhanced.programs.push(currentProgram);
        }
        currentProgram = programMatch;
        this.programStructure.currentFB = programMatch.fbNumber;
        return;
      }

      // 2. Detect variable assignments
      const assignmentMatch = this.detectVariableAssignment(trimmed, index + 1);
      if (assignmentMatch) {
        enhanced.variableAssignments.push(assignmentMatch);
        if (currentProgram) {
          currentProgram.assignments = currentProgram.assignments || [];
          currentProgram.assignments.push(assignmentMatch);
        }
        return;
      }

      // 3. Detect comments and descriptions
      const commentMatch = this.detectComment(trimmed, index + 1);
      if (commentMatch) {
        enhanced.comments.push(commentMatch);
        return;
      }

      // 4. Detect OR-blocks
      const orBlockResult = this.detectOrBlock(trimmed, index + 1, currentOrBlock);
      if (orBlockResult.isOrBlock) {
        currentOrBlock = orBlockResult.orBlock;
        if (orBlockResult.completed) {
          enhanced.orBlocks.push(currentOrBlock);
          currentOrBlock = null;
        }
        return;
      }

      // 5. Detect and normalize references
      const normalizedRef = this.normalizeReference(trimmed, index + 1);
      if (normalizedRef) {
        enhanced.normalizedReferences.push(normalizedRef);
        return;
      }

      // 6. Detect entities
      const entityMatch = this.detectEntity(trimmed, index + 1);
      if (entityMatch) {
        enhanced.entities.push(entityMatch);
        return;
      }

      // 7. Enhance existing conditions with compound logic
      const conditionMatch = this.enhanceCondition(trimmed, index + 1, baseResult);
      if (conditionMatch) {
        enhanced.compoundConditions.push(conditionMatch);
      }
    });

    // Add final program if exists
    if (currentProgram) {
      enhanced.programs.push(currentProgram);
    }

    // Build program hierarchy
    enhanced.programHierarchy = this.buildProgramHierarchy(enhanced);

    return enhanced;
  }

  /**
   * Detect FB program headers
   */
  detectFBProgram(text, lineNumber) {
    const match = text.match(this.advancedPatterns.fbProgram);
    if (!match) return null;

    const [, type, name, fbNumber] = match;
    
    return {
      type: 'fb_program',
      programType: type,
      name: name.trim(),
      fbNumber: fbNumber,
      lineNumber,
      steps: [],
      assignments: [],
      references: []
    };
  }

  /**
   * Detect variable assignments (simple and complex)
   */
  detectVariableAssignment(text, lineNumber) {
    // Try complex assignment first (Horde[x].Etage_Daten[y].Status = 0)
    let match = text.match(this.advancedPatterns.complexAssignment);
    if (match) {
      const [, arrayName, index1, property1, index2, property2, value] = match;
      return {
        type: 'complex_assignment',
        arrayName,
        indices: [
          { property: arrayName, index: index1 },
          { property: property1, index: index2 }
        ],
        finalProperty: property2,
        value: value.trim(),
        lineNumber,
        originalText: text
      };
    }

    // Try matrix assignment (Horde[x].Property = value)
    match = text.match(this.advancedPatterns.matrixAssignment);
    if (match) {
      const [, arrayName, index, property, value] = match;
      return {
        type: 'matrix_assignment',
        arrayName,
        index: index.trim(),
        property,
        value: value.trim(),
        lineNumber,
        originalText: text
      };
    }

    // Try simple assignment (Variable 1 (Description) = 21)
    match = text.match(this.advancedPatterns.simpleAssignment);
    if (match) {
      const [, name, description, value] = match;
      return {
        type: 'simple_assignment',
        name: name.trim(),
        description: description.trim(),
        value: value.trim(),
        lineNumber,
        originalText: text
      };
    }

    return null;
  }

  /**
   * Detect comments and descriptions
   */
  detectComment(text, lineNumber) {
    // Single line comment
    let match = text.match(this.advancedPatterns.singleLineComment);
    if (match) {
      return {
        type: 'comment',
        subtype: 'single_line',
        content: match[1].trim(),
        lineNumber,
        originalText: text
      };
    }

    // Multi-line comment
    match = text.match(this.advancedPatterns.multiLineComment);
    if (match) {
      return {
        type: 'comment',
        subtype: 'multi_line',
        content: match[1].trim(),
        lineNumber,
        originalText: text
      };
    }

    // Inline comment
    match = text.match(this.advancedPatterns.inlineComment);
    if (match) {
      return {
        type: 'comment',
        subtype: 'inline',
        content: match[2].trim(),
        codeContent: match[1].trim(),
        lineNumber,
        originalText: text
      };
    }

    return null;
  }

  /**
   * Detect OR-blocks and compound conditions
   */
  detectOrBlock(text, lineNumber, currentOrBlock) {
    // OR block start
    if (this.advancedPatterns.orBlockStart.test(text)) {
      return {
        isOrBlock: true,
        orBlock: {
          type: 'or_block',
          items: [],
          startLine: lineNumber,
          endLine: null
        },
        completed: false
      };
    }

    // OR block end
    if (this.advancedPatterns.orBlockEnd.test(text) && currentOrBlock) {
      currentOrBlock.endLine = lineNumber;
      return {
        isOrBlock: true,
        orBlock: currentOrBlock,
        completed: true
      };
    }

    // OR block item
    if (currentOrBlock) {
      const match = text.match(this.advancedPatterns.orBlockItem);
      if (match) {
        currentOrBlock.items.push({
          condition: match[1].trim(),
          lineNumber,
          originalText: text
        });
        return {
          isOrBlock: true,
          orBlock: currentOrBlock,
          completed: false
        };
      }
    }

    return { isOrBlock: false };
  }

  /**
   * Normalize references to standardized format
   */
  normalizeReference(text, lineNumber) {
    // Try FB step reference with FB number
    let match = text.match(this.advancedPatterns.fbStepReference);
    if (match) {
      const [, description, program, fbNumber, stepKeyword, steps] = match;
      return {
        type: 'standardized_reference',
        description: description.trim(),
        program: program.trim(),
        fbNumber,
        stepKeyword,
        steps: steps.split('+').map(s => parseInt(s.trim())),
        standardizedFormat: `${fbNumber}.${stepKeyword} ${steps}`,
        lineNumber,
        originalText: text
      };
    }

    // Try standard reference without FB number
    match = text.match(this.advancedPatterns.standardizedReference);
    if (match) {
      const [, description, program, stepKeyword, steps] = match;
      return {
        type: 'standardized_reference',
        description: description.trim(),
        program: program.trim(),
        fbNumber: this.programStructure.currentFB || 'UNKNOWN',
        stepKeyword,
        steps: steps.split('+').map(s => parseInt(s.trim())),
        standardizedFormat: `${this.programStructure.currentFB || 'UNKNOWN'}.${stepKeyword} ${steps}`,
        lineNumber,
        originalText: text
      };
    }

    return null;
  }

  /**
   * Detect entities (Käsezähler, Störung, etc.)
   */
  detectEntity(text, lineNumber) {
    // Käsezähler
    let match = text.match(this.advancedPatterns.käseZähler);
    if (match) {
      return {
        type: 'entity',
        entityType: 'käsezähler',
        name: match[2].trim(),
        description: match[3].trim(),
        lineNumber,
        originalText: text
      };
    }

    // Störung
    match = text.match(this.advancedPatterns.störung);
    if (match) {
      return {
        type: 'entity',
        entityType: 'störung',
        description: match[2].trim(),
        lineNumber,
        originalText: text
      };
    }

    // Freigabe
    match = text.match(this.advancedPatterns.freigabe);
    if (match) {
      return {
        type: 'entity',
        entityType: 'freigabe',
        description: match[2].trim(),
        lineNumber,
        originalText: text
      };
    }

    return null;
  }

  /**
   * Enhance conditions with compound logic
   */
  enhanceCondition(text, lineNumber, baseResult) {
    // Check if this is a comparison
    let match = text.match(this.advancedPatterns.comparison);
    if (match) {
      return {
        type: 'compound_condition',
        subtype: 'comparison',
        leftOperand: match[1].trim(),
        operator: match[2].trim(),
        rightOperand: match[3].trim(),
        lineNumber,
        originalText: text
      };
    }

    // Check if this is an evaluation
    match = text.match(this.advancedPatterns.evaluation);
    if (match) {
      return {
        type: 'compound_condition',
        subtype: 'evaluation',
        subject: match[1].trim(),
        operator: match[2].trim(),
        value: match[3].trim(),
        lineNumber,
        originalText: text
      };
    }

    return null;
  }

  /**
   * Build program hierarchy from parsed data
   */
  buildProgramHierarchy(enhanced) {
    const hierarchy = {
      mainPrograms: [],
      subPrograms: [],
      relationships: []
    };

    enhanced.programs.forEach(program => {
      if (program.programType.toLowerCase().includes('haupt')) {
        hierarchy.mainPrograms.push(program);
      } else {
        hierarchy.subPrograms.push(program);
      }
    });

    // Build relationships from cross-references
    enhanced.normalizedReferences.forEach(ref => {
      const relationship = {
        sourceProgram: this.programStructure.currentFB,
        targetProgram: ref.fbNumber,
        targetSteps: ref.steps,
        description: ref.description,
        type: 'step_reference'
      };
      hierarchy.relationships.push(relationship);
    });

    return hierarchy;
  }

  /**
   * Export enhanced training data
   */
  exportEnhancedTrainingData() {
    const baseData = super.exportTrainingData();
    
    return {
      ...baseData,
      advancedFeatures: {
        programs: this.programStructure.fbHierarchy.size,
        variableAssignments: 0, // Will be filled during parsing
        comments: 0,
        orBlocks: 0,
        entities: 0,
        normalizedReferences: 0
      },
      categories: [
        'fb_program',
        'simple_assignment',
        'complex_assignment',
        'matrix_assignment',
        'comment',
        'or_block',
        'standardized_reference',
        'entity',
        'compound_condition'
      ]
    };
  }
}

export default AdvancedParser;