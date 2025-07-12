export const defaultSyntaxRules = {
    stepKeywords: {
        step: ['STAP', 'SCHRITT', 'STEP'],
        rest: ['RUST', 'RUHE', 'IDLE'],
        end: ['KLAAR', 'FERTIG', 'END']
    },
    // Real-world patterns from actual Word documents
    realWorldPatterns: {
        // SCHRITT 1 (description) - parentheses format
        schrittParentheses: /^(SCHRITT|STAP|STEP)\s+(\d+)\s+\((.+)\)$/i,
        // RUHE (description) - parentheses format
        ruheParentheses: /^(RUST|RUHE|IDLE)\s+\((.+)\)$/i,
        // SCHRITT 1: description - colon format (legacy)
        schrittColon: /^(SCHRITT|STAP|STEP)\s+(\d+)\s*:\s*(.+)$/i,
        // RUHE: description - colon format (legacy)
        ruheColon: /^(RUST|RUHE|IDLE)\s*:\s*(.+)$/i,
        // Mixed format support
        schrittMixed: /^(SCHRITT|STAP|STEP)\s+(\d+)\s*[:\(]\s*(.+?)\)?$/i,
        ruheMixed: /^(RUST|RUHE|IDLE)\s*[:\(]\s*(.+?)\)?$/i
    },
    variableDetection: {
        timerKeywords: ['TIJD', 'TIME', 'ZEIT'],
        markerKeywords: ['MARKER', 'FLAG', 'MERKER'],
        storingKeywords: ['STORING', 'FAULT', 'STÖRUNG']
    },
    conditions: {
        orPrefix: '+',
        notPrefix: ['NIET', 'NICHT', 'NOT'],
        transitionPrefix: '->'
    },
    format: {
        requireColon: true,
        allowSpaces: true
    },
    // Real-world patterns from actual Word documents (V2.0 - Enhanced)
    stepPatterns: [
        {
            pattern: /^(SCHRITT|STAP|STEP)\s+(\d+)\s+\((.+)\)$/i,
            description: "Real-world Word format: SCHRITT 1 (description)",
            confidence: 0.95,
            examples: [
                "SCHRITT 1 (Start Entleeren Formenlager)",
                "SCHRITT 2 (Prüfung Formenlager leer)",
                "SCHRITT 3 (Freigabe Füllen Formenlager)"
            ]
        },
        {
            pattern: /^(RUST|RUHE|IDLE)\s+\((.+)\)$/i,
            description: "Real-world Word format: RUHE (description)",
            confidence: 0.95,
            examples: [
                "RUHE (Warten auf Startbedingungen)",
                "RUHE (Bereit für nächsten Zyklus)",
                "RUHE (Störung behoben)"
            ]
        },
        {
            pattern: /^(SCHRITT|STAP|STEP)\s+(\d+)\s*:\s*(.+)$/i,
            description: "Legacy colon format: SCHRITT 1: description",
            confidence: 0.85,
            examples: [
                "SCHRITT 1: Start Entleeren Formenlager",
                "SCHRITT 2: Prüfung Formenlager leer"
            ]
        },
        {
            pattern: /^(RUST|RUHE|IDLE)\s*:\s*(.+)$/i,
            description: "Legacy colon format: RUHE: description",
            confidence: 0.85,
            examples: [
                "RUHE: Warten auf Startbedingungen",
                "RUHE: Bereit für nächsten Zyklus"
            ]
        },
        {
            pattern: /^(\w+)\s+(\d+)\s*:\s*(.*)$/,
            description: "Auto-learned from 6269 examples - enhanced step detection",
            confidence: 0.7,
            examples: [
                "3.3\tO0x: Status Formenlagern  FB304\t13",
                "3.4\tO01: Status Formenlager  FB306\t14",
                "3.5\tO02: Status Formenlager ohne Deckel  FB308\t17"
            ]
        },
        {
            pattern: /^(\d+\.?\d*)\s*([A-Z]\d*[x]?)\s*:\s*(.+)\s+FB\d+\s*\t?\d*$/,
            description: "Auto-learned pattern for FB-referenced steps",
            confidence: 0.8,
            examples: [
                "3.3\tO0x: Status Formenlagern  FB304\t13",
                "3.4\tO01: Status Formenlager  FB306\t14"
            ]
        },
        {
            pattern: /^(\d+\.?\d*\.?\d*)\s*([A-Z]\d*[x]?)\s*:\s*(.+?)(?:\s+FB\d+)?\s*\t?\d*$/,
            description: "Enhanced FB-reference pattern with optional FB number",
            confidence: 0.85,
            examples: [
                "3.2.1\tN10: Blockierung Einfuhrrinne FB130\t27",
                "3.2.2\tN11: Blockierung Einfuhrrinne FB132\t28",
                "3.2.3\tT10: Füllen Horde  FB134\t29"
            ]
        }
    ],
    conditionPatterns: [
        {
            pattern: /\([^)]+\s+(SCHRITT|STAP|STEP)\s+([0-9+]+)\)/,
            type: "cross_reference",
            confidence: 0.9,
            description: "Auto-learned cross-reference pattern"
        }
    ],
    // Enhanced ML patterns from persistent training (Production-Ready)
    crossReferencePatterns: [
        {
            pattern: /\(([^)]+)\s+(SCHRITT|STAP|STEP)\s+([0-9+]+)\)/,
            description: "ML-learned cross-reference pattern (frequency: 1630)",
            confidence: 0.9,
            frequency: 1630,
            accuracy: 0.9,
            examples: [
                "(Program SCHRITT 5+6)",
                "(Ausfuhr STEP 12+13)",
                "(Kontrolle STAP 8+9)"
            ]
        }
    ],
    // Enhanced variable detection patterns (ML-optimized v3 - Production)
    variablePatterns: [
        {
            pattern: /^([^=]+)\s*=\s*(.*)$/,
            group: "hulpmerker",
            confidence: 0.8,
            frequency: 711,
            accuracy: 0.8,
            description: "ML-learned variable assignment pattern (frequency: 711)",
            examples: [
                "Freigabe Füllen Formenlager=",
                "Start Entleeren Horde=",
                "Aktuelle Position="
            ]
        },
        {
            pattern: /^(Freigabe|Start|Aktuell|Aktuelle)\s+(.+)\s*=$/,
            group: "hulpmerker",
            confidence: 0.85,
            description: "Auto-learned control variable pattern"
        },
        {
            pattern: /^(Einfuhr|Ausfuhr|Füllen|Entleeren|Umschwimmen|Freigabe)\s+(.+)\s*=$/,
            group: "hulpmerker",
            confidence: 0.82,
            description: "Auto-learned process control variable pattern"
        }
    ],
    // ML Training Metadata (Production Stats)
    mlTrainingStats: {
        totalExamples: 8107,
        totalVariables: 8697,
        trainingAccuracy: 1.0,
        validationAccuracy: 0.513,
        unknownPatternReduction: 0.51,
        lastTrainingDate: "2025-07-11T21:42:37.684Z",
        convergenceIterations: 2,
        patternFrequencies: {
            variablePatterns: 711,
            crossReferencePatterns: 1630
        }
    }
};