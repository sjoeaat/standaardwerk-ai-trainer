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
import { ContentPreprocessor } from './ContentPreprocessor.js';

/**
 * Advanced Parser for complex industrial program structures
 */
export class AdvancedParser extends FlexibleParser {
  constructor(syntaxRules = {}, validationRules = {}) {
    super(syntaxRules, validationRules);
    
    // Initialize content preprocessor
    this.preprocessor = new ContentPreprocessor();
    
    // Enhanced patterns for advanced parsing
    this.advancedPatterns = {
      // FB program headers
      fbProgram: /^(Hauptprogramm|Unterprogramm|Programm)\s+([A-Za-z0-9_\s]+)\s+(FB\d+)$/i,
      
      // Variable assignments (simple and complex) - improved patterns
      simpleAssignment: /^([A-Za-z_][A-Za-z0-9_\s]*)\s*\(([^)]+)\)\s*=\s*(.+)$/,
      generalAssignment: /^([A-Za-z_][A-Za-z0-9_\s]+)\s*=\s*(.+)$/,
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
      
      // Transition rules (fixed patterns)
      transitionRule: /^\+\s*von\s+SCHRITT\s+(\d+)/i,
      jumpRule: /^\+\s*nach\s+SCHRITT\s+(\d+)/i,
      
      // Compound conditions and OR-blocks (improved patterns)
      orBlockStart: /^\s*\[\s*$/,
      orBlockEnd: /^\s*\]\s*$/,
      orBlockItem: /^\+?\s*(.+?)\s*$/,
      
      // Entity types
      käseZähler: /^(Käsezähler|Cheese Counter)\s+([A-Za-z0-9_\s]+)\s*(.*)$/i,
      störung: /^(NICHT\s+)?(Störung|Fault|Error)\s*[:.]?\s*(.+)$/i,
      freigabe: /^(Freigabe|Release|Enable)\s+(.+)$/i,
      
      // Comparisons and evaluations (improved patterns)
      comparison: /^(.+?)\s*([<>=!]+|==|!=|<=|>=)\s*(.+)$/,
      evaluation: /^(.+?)\s*(ist|is)\s+(.+)$/i,
      
      // Logical operators
      logicalAnd: /^(.+?)\s+(&|UND|AND)\s+(.+)$/i,
      logicalOr: /^(.+?)\s+(ODER|OR)\s+(.+)$/i,
      
      // Time patterns
      timePattern: /^Zeit\s+(\d+)\s*(sek|min|sec|seconds?|minutes?)\s*\?\?$/i,
      
      // Negation patterns
      negationPattern: /^(NICHT|NOT)\s+(.+)$/i
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
    // Step 1: Preprocess the content to fix common issues
    const preprocessedText = this.preprocessor.preprocess(text);
    
    // Step 2: Run the base FlexibleParser on preprocessed text
    const baseResult = super.parseText(preprocessedText, options);
    
    // Step 3: Enhance with advanced parsing
    const enhancedResult = this.enhanceWithAdvancedParsing(preprocessedText, baseResult);
    
    // Step 4: Add preprocessing statistics
    enhancedResult.preprocessingStats = this.preprocessor.getPreprocessingStats(text, preprocessedText);
    
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

      // 7. Detect transition rules
      const transitionMatch = this.detectTransitionRule(trimmed, index + 1);
      if (transitionMatch) {
        enhanced.compoundConditions.push(transitionMatch);
        return;
      }

      // 8. Enhance existing conditions with compound logic
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

    // Try general assignment (Variable Name = Value)
    match = text.match(this.advancedPatterns.generalAssignment);
    if (match) {
      const [, name, value] = match;
      // Skip if this looks like a step or condition
      if (name.match(/^(SCHRITT|STAP|STEP|RUHE|RUST|IDLE)/i)) {
        return null;
      }
      return {
        type: 'general_assignment',
        name: name.trim(),
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
   * Detect transition rules (+ von SCHRITT X, + nach SCHRITT X)
   */
  detectTransitionRule(text, lineNumber) {
    // Check for transition rule (+ von SCHRITT X)
    let match = text.match(this.advancedPatterns.transitionRule);
    if (match) {
      const [, stepNumber] = match;
      return {
        type: 'transition_rule',
        subtype: 'von',
        targetStep: parseInt(stepNumber),
        lineNumber,
        originalText: text
      };
    }

    // Check for jump rule (+ nach SCHRITT X)
    match = text.match(this.advancedPatterns.jumpRule);
    if (match) {
      const [, stepNumber] = match;
      return {
        type: 'transition_rule',
        subtype: 'nach',
        targetStep: parseInt(stepNumber),
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