// =====================================================================
// src/core/IntelligentConditionParser.js - Intelligent Condition Parser
// =====================================================================
// Advanced condition parsing using ML-learned patterns to reduce
// unknown patterns from 46k to <5k by intelligently categorizing
// conditions, cross-references, and industrial automation patterns
// =====================================================================

export class IntelligentConditionParser {
  constructor() {
    this.patterns = {
      // Cross-reference patterns (learned from training)
      crossReferences: [
        /\([^)]+\s+(SCHRITT|STAP|STEP)\s+[0-9+&-]+\)/gi,
        /\([^)]+\s+(RUHE|RUST|IDLE)\s*[&)]/gi,
        /\(Status\s+[^)]+\s+(SCHRITT|STAP|STEP)\s+\d+\)/gi,
        /\([^)]+\s+(NICHT|NOT|NIET)\s+[^)]+\s+(SCHRITT|STAP|STEP)\s+\d+\)/gi,
      ],
      
      // Condition patterns
      conditions: [
        /^(\+|\-|\s{2,}|\t)\s*[^()]+$/,  // Indented conditions
        /^(\+|\-)\s*[A-Z][^()]+$/,       // Prefix conditions
        /^(\+|\-)\s*NICHT\s+/gi,         // Negated conditions
        /^(\+|\-)\s*NOT\s+/gi,           // English negated conditions
        /^(\+|\-)\s*NIET\s+/gi,          // Dutch negated conditions
      ],
      
      // Zeit/Time patterns
      zeitPatterns: [
        /Zeit\s+\d+\s*sek/gi,
        /Time\s+\d+\s*sec/gi,
        /TIJD\s+\d+\s*sec/gi,
        /\d+\s*sek\s*\?\?/gi,
        /\d+\s*sec\s*\?\?/gi,
      ],
      
      // Technical status patterns
      technicalStatus: [
        /^[A-Z]\d+[x]?\s*:\s*/,          // O01:, N10:, etc.
        /^[A-Z]{2,}\s+[A-Z]\d+/,         // STATUS O01, etc.
        /^[A-Z]\d+\s*=\s*[01]/,          // O01 = 1, etc.
        /^Position\s+\d+\s*=/gi,         // Position 0=1, etc.
        /FB\d+\s*\t?\d*$/,               // FB304 references
      ],
      
      // Variable assignments
      variableAssignments: [
        /^[A-Za-z][^=]*\s*=\s*[^=]+$/,   // Variable = value
        /^[A-Za-z]\d*\s*=\s*/,           // V1 =, F5 =, etc.
        /^[A-Za-z]+\s+[A-Za-z]+\s*=\s*/,  // Multi-word variables
      ],
      
      // Industrial automation patterns
      industrialPatterns: [
        /^Start\s+[A-Z]/gi,              // Start commands
        /^Stop\s+[A-Z]/gi,               // Stop commands
        /^Freigabe\s+[A-Z]/gi,           // Release commands
        /^Blockierung\s+[A-Z]/gi,        // Blocking commands
        /^Störung\s*:/gi,                // Fault messages
        /^Störung\s+[A-Z]/gi,            // Fault conditions
        /^Warten\s+[A-Z]/gi,             // Wait conditions
        /^Prüfung\s+[A-Z]/gi,            // Check conditions
      ],
      
      // Numbering and indexing
      numberingPatterns: [
        /^\d+\.\d+\.\d+\t/,              // 3.2.1 format
        /^\d+\.\d+\t/,                   // 3.2 format
        /^\d+\t/,                        // Simple numbering
        /^\d+\s+[A-Z]/,                  // Number + text
      ],
      
      // Array and data structure patterns
      arrayPatterns: [
        /\[[^\]]+\]/,                    // Array notation [X]
        /\w+\[\d+\]/,                    // Variable[index]
        /\w+\[[A-Z]\d*\]/,               // Variable[Var]
        /Horde\[\d+\]\.Data\[\d+\]/,     // Complex array access
      ],
      
      // Boolean and logical patterns
      booleanPatterns: [
        /\s+&\s+/,                       // AND operator
        /\s+\|\s+/,                      // OR operator
        /\s+UND\s+/gi,                   // German AND
        /\s+ODER\s+/gi,                  // German OR
        /\s+EN\s+/gi,                    // Dutch AND
        /\s+OF\s+/gi,                    // Dutch OR
      ],
      
      // Numeric and comparison patterns
      numericPatterns: [
        /[<>=!]+\s*\d+/,                 // Comparisons
        /\d+\s*[<>=!]+/,                 // Numeric comparisons
        /\d+\.\d+/,                      // Decimal numbers
        /\d+%/,                          // Percentages
        /\d+°C/,                         // Temperature
        /\d+bar/,                        // Pressure
      ]
    };
  }

  /**
   * Parse and categorize unknown patterns
   */
  parseUnknownPatterns(unknownPatterns) {
    const categorized = {
      crossReferences: [],
      conditions: [],
      zeitPatterns: [],
      technicalStatus: [],
      variableAssignments: [],
      industrialPatterns: [],
      numberingPatterns: [],
      arrayPatterns: [],
      booleanPatterns: [],
      numericPatterns: [],
      unrecognized: []
    };

    unknownPatterns.forEach(pattern => {
      const text = pattern.text || pattern.originalLine || pattern;
      let categorized_pattern = false;

      // Check each pattern category
      for (const [category, patterns] of Object.entries(this.patterns)) {
        if (patterns.some(regex => regex.test(text))) {
          const categoryKey = this.mapCategoryToKey(category);
          if (categoryKey && categorized[categoryKey]) {
            categorized[categoryKey].push({
              text,
              originalPattern: pattern,
              matchedCategory: category,
              confidence: this.calculateConfidence(text, patterns)
            });
            categorized_pattern = true;
            break;
          }
        }
      }

      if (!categorized_pattern) {
        categorized.unrecognized.push({
          text,
          originalPattern: pattern,
          matchedCategory: 'unrecognized',
          confidence: 0
        });
      }
    });

    return categorized;
  }

  /**
   * Map internal category names to result keys
   */
  mapCategoryToKey(category) {
    const mapping = {
      'crossReferences': 'crossReferences',
      'conditions': 'conditions',
      'zeitPatterns': 'zeitPatterns',
      'technicalStatus': 'technicalStatus',
      'variableAssignments': 'variableAssignments',
      'industrialPatterns': 'industrialPatterns',
      'numberingPatterns': 'numberingPatterns',
      'arrayPatterns': 'arrayPatterns',
      'booleanPatterns': 'booleanPatterns',
      'numericPatterns': 'numericPatterns'
    };
    return mapping[category];
  }

  /**
   * Calculate confidence score for a pattern match
   */
  calculateConfidence(text, patterns) {
    let maxConfidence = 0;
    patterns.forEach(pattern => {
      const match = text.match(pattern);
      if (match) {
        // Higher confidence for more specific matches
        const specificity = match[0].length / text.length;
        const confidence = Math.min(0.95, 0.6 + (specificity * 0.35));
        maxConfidence = Math.max(maxConfidence, confidence);
      }
    });
    return maxConfidence;
  }

  /**
   * Generate improved syntax rules based on categorized patterns
   */
  generateImprovedRules(categorizedPatterns) {
    const improvedRules = {
      crossReferencePatterns: [],
      conditionPatterns: [],
      zeitPatterns: [],
      technicalStatusPatterns: [],
      variablePatterns: [],
      industrialPatterns: []
    };

    // Generate patterns for each category
    Object.entries(categorizedPatterns).forEach(([category, patterns]) => {
      if (patterns.length > 0 && category !== 'unrecognized') {
        const ruleCategory = this.mapCategoryToRuleCategory(category);
        if (ruleCategory && improvedRules[ruleCategory]) {
          improvedRules[ruleCategory].push(...this.generatePatternsForCategory(patterns));
        }
      }
    });

    return improvedRules;
  }

  /**
   * Map categorized patterns to rule categories
   */
  mapCategoryToRuleCategory(category) {
    const mapping = {
      'crossReferences': 'crossReferencePatterns',
      'conditions': 'conditionPatterns',
      'zeitPatterns': 'zeitPatterns',
      'technicalStatus': 'technicalStatusPatterns',
      'variableAssignments': 'variablePatterns',
      'industrialPatterns': 'industrialPatterns'
    };
    return mapping[category];
  }

  /**
   * Generate regex patterns for a category
   */
  generatePatternsForCategory(patterns) {
    const generated = [];
    
    // Group similar patterns
    const grouped = this.groupSimilarPatterns(patterns);
    
    grouped.forEach(group => {
      if (group.length >= 3) { // Only generate if we have enough examples
        const pattern = this.generateRegexFromGroup(group);
        if (pattern) {
          generated.push({
            pattern: pattern,
            description: `Auto-generated from ${group.length} examples`,
            confidence: group.reduce((sum, p) => sum + p.confidence, 0) / group.length,
            examples: group.slice(0, 3).map(p => p.text)
          });
        }
      }
    });

    return generated;
  }

  /**
   * Group similar patterns together
   */
  groupSimilarPatterns(patterns) {
    const groups = [];
    
    patterns.forEach(pattern => {
      let addedToGroup = false;
      
      for (const group of groups) {
        if (this.patternsAreSimilar(pattern, group[0])) {
          group.push(pattern);
          addedToGroup = true;
          break;
        }
      }
      
      if (!addedToGroup) {
        groups.push([pattern]);
      }
    });
    
    return groups;
  }

  /**
   * Check if two patterns are similar
   */
  patternsAreSimilar(pattern1, pattern2) {
    const text1 = pattern1.text;
    const text2 = pattern2.text;
    
    // Simple similarity check - same length and structure
    if (Math.abs(text1.length - text2.length) > 20) return false;
    
    // Check for common structural elements
    const struct1 = this.extractStructure(text1);
    const struct2 = this.extractStructure(text2);
    
    return struct1 === struct2;
  }

  /**
   * Extract structural pattern from text
   */
  extractStructure(text) {
    return text
      .replace(/\d+/g, 'N')        // Numbers to N
      .replace(/[A-Z]{2,}/g, 'W')  // Words to W
      .replace(/[a-z]+/g, 'w')     // Lowercase words to w
      .replace(/\s+/g, ' ')        // Normalize whitespace
      .trim();
  }

  /**
   * Generate regex from group of similar patterns
   */
  generateRegexFromGroup(group) {
    if (group.length < 3) return null;
    
    // Find common structure
    const structures = group.map(p => this.extractStructure(p.text));
    const commonStructure = this.findCommonStructure(structures);
    
    if (commonStructure) {
      return this.structureToRegex(commonStructure);
    }
    
    return null;
  }

  /**
   * Find common structure among patterns
   */
  findCommonStructure(structures) {
    if (structures.length === 0) return null;
    
    let common = structures[0];
    
    for (let i = 1; i < structures.length; i++) {
      common = this.findCommonSubstring(common, structures[i]);
      if (common.length < 3) return null; // Too short to be useful
    }
    
    return common;
  }

  /**
   * Find common substring between two strings
   */
  findCommonSubstring(str1, str2) {
    let common = '';
    const minLength = Math.min(str1.length, str2.length);
    
    for (let i = 0; i < minLength; i++) {
      if (str1[i] === str2[i]) {
        common += str1[i];
      } else {
        break;
      }
    }
    
    return common;
  }

  /**
   * Convert structure to regex
   */
  structureToRegex(structure) {
    return structure
      .replace(/N/g, '\\d+')          // Numbers
      .replace(/W/g, '[A-Z]{2,}')     // Uppercase words
      .replace(/w/g, '[a-z]+')        // Lowercase words
      .replace(/\s+/g, '\\s+')        // Whitespace
      .replace(/\(/g, '\\(')          // Escape parentheses
      .replace(/\)/g, '\\)')
      .replace(/\[/g, '\\[')          // Escape brackets
      .replace(/\]/g, '\\]');
  }

  /**
   * Generate comprehensive statistics
   */
  generateStatistics(categorizedPatterns) {
    const stats = {
      totalPatterns: 0,
      categorizedPatterns: 0,
      unrecognizedPatterns: 0,
      categoryBreakdown: {},
      reductionPercentage: 0
    };

    Object.entries(categorizedPatterns).forEach(([category, patterns]) => {
      stats.totalPatterns += patterns.length;
      stats.categoryBreakdown[category] = patterns.length;
      
      if (category === 'unrecognized') {
        stats.unrecognizedPatterns = patterns.length;
      } else {
        stats.categorizedPatterns += patterns.length;
      }
    });

    stats.reductionPercentage = stats.totalPatterns > 0 ? 
      (stats.categorizedPatterns / stats.totalPatterns) * 100 : 0;

    return stats;
  }
}

export default IntelligentConditionParser;