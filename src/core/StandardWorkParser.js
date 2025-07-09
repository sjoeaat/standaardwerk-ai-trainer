export class StandardWorkParser {
    constructor(syntaxRules) {
        if (!syntaxRules?.stepKeywords) {
            throw new Error('Invalid syntax rules: stepKeywords are required');
        }
        this.syntaxRules = syntaxRules;
        this.patterns = this.compilePatterns();
        this.currentStep = null;
        this.result = {
            steps: [],
            variables: [],
            timers: [],
            markers: [],
            storingen: [],
            errors: []
        };
    }

    compilePatterns() {
        const { stepKeywords, variableDetection, conditions } = this.syntaxRules;

        // Handle both string and array formats for notPrefix
        const notPrefixes = Array.isArray(conditions.notPrefix) 
            ? conditions.notPrefix 
            : [conditions.notPrefix];

        return {
            // Basic patterns
            step: new RegExp(`^(${stepKeywords.step.join('|')})\\s*(\\d+)\\s*:\\s*(.*)$`, 'i'),
            rest: new RegExp(`^(${stepKeywords.rest.join('|')})\\s*[:\\(]\\s*(.*)\\)?$`, 'i'),
            end: new RegExp(`^(${stepKeywords.end.join('|')})\\s*[:\\(]\\s*(.*)\\)?$`, 'i'),
            
            // Variable patterns
            variableDefinition: /^([A-Za-z_][A-ZaZ0-9_]*)\s*=\s*(.*)$/,
            
            // Timer patterns with all formats
            timer: new RegExp(
                `^(?:${variableDetection.timerKeywords.join('|')})\\s*[~]?\\s*(\\d+)\\s*(Sek|Min|s|m|Sekunden|Minuten|Seconds|Minutes)?$`,
                'i'
            ),
            
            // Extended marker patterns
            marker: new RegExp(
                `^(?:${variableDetection.markerKeywords.join('|')})\\s+([A-Za-z_][A-Za-z0-9_]*)\\s*=?\\s*(.*)$`,
                'i'
            ),
            
            // Extended storing patterns
            storing: new RegExp(
                `^(?:${variableDetection.storingKeywords.join('|')})\\s+([A-Za-z_][A-Za-z0-9_]*)\\s*:?\\s*(.*)$`,
                'i'
            ),

            // Condition patterns
            orCondition: new RegExp(`^\\s*\\${conditions.orPrefix}\\s*(.+)$`),
            notCondition: new RegExp(`^\\s*(${notPrefixes.join('|')})\\s+(.+)$`, 'i'),
            transitionCondition: new RegExp(`^\\s*${conditions.transitionPrefix}\\s*(.+)$`)
        };
    }

    parse(code) {
        if (!code) return this.result;
        
        // Reset state
        this.result = {
            steps: [],
            variables: [],
            timers: [],
            markers: [],
            storingen: [],
            errors: []
        };

        const lines = code.split(/\r?\n/);
        let pendingConditions = [];

        lines.forEach((line, lineNumber) => {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('//')) return;

            // Try to parse special elements
            if (this.parseSpecialElement(trimmedLine)) return;

            // Try to parse as step or rest
            const stepResult = this.parseStep(trimmedLine);
            if (stepResult) {
                if (this.currentStep) {
                    this.finalizeStep(this.currentStep, pendingConditions);
                }
                this.currentStep = {
                    ...stepResult,
                    conditions: [],
                    timers: [],
                    markers: [],
                    storingen: [],
                    lineNumber: lineNumber + 1
                };
                pendingConditions = [];
                return;
            }

            // Collect indented lines as conditions
            if (this.currentStep && (line.startsWith(' ') || line.startsWith('\t'))) {
                pendingConditions.push(trimmedLine);
            }
        });

        // Finalize last step
        if (this.currentStep) {
            this.finalizeStep(this.currentStep, pendingConditions);
        }

        return this.result;
    }

    parseSpecialElement(line) {
        // Try to match variable definition
        const varMatch = line.match(this.patterns.variableDefinition);
        if (varMatch) {
            this.result.variables.push({
                name: varMatch[1],
                value: varMatch[2]
            });
            return true;
        }

        // Try to match timer
        const timerMatch = line.match(this.patterns.timer);
        if (timerMatch) {
            this.result.timers.push({
                duration: parseInt(timerMatch[1]),
                unit: timerMatch[2] || 'Sek'
            });
            return true;
        }

        // Try to match marker
        const markerMatch = line.match(this.patterns.marker);
        if (markerMatch) {
            this.result.markers.push({
                name: markerMatch[1],
                value: markerMatch[2] || ''
            });
            return true;
        }

        // Try to match storing
        const storingMatch = line.match(this.patterns.storing);
        if (storingMatch) {
            this.result.storingen.push({
                name: storingMatch[1],
                description: storingMatch[2] || ''
            });
            return true;
        }

        return false;
    }

    parseStep(line) {
        // Check for RUST pattern
        const rustMatch = line.match(this.patterns.rest);
        if (rustMatch) {
            let description = rustMatch[2] || '';
            // Remove trailing parenthesis if present
            description = description.replace(/\)$/, '');
            return {
                type: 'RUST',
                keyword: rustMatch[1],
                number: 0,
                description: description
            };
        }

        // Check for STAP pattern
        const stepMatch = line.match(this.patterns.step);
        if (stepMatch) {
            return {
                type: 'STAP',
                keyword: stepMatch[1],
                number: parseInt(stepMatch[2]),
                description: stepMatch[3] || ''
            };
        }

        // Check for END pattern
        const endMatch = line.match(this.patterns.end);
        if (endMatch) {
            let description = endMatch[2] || '';
            // Remove trailing parenthesis if present
            description = description.replace(/\)$/, '');
            return {
                type: 'END',
                keyword: endMatch[1],
                number: 0,
                description: description
            };
        }

        return null;
    }

    finalizeStep(step, pendingConditions) {
        if (!step) return;

        // Process pending conditions
        step.conditions = pendingConditions.filter(cond => cond.trim() !== '');
        
        // Extract timers, markers, and storingen from conditions
        step.conditions.forEach(condition => {
            const timerMatch = condition.match(this.patterns.timer);
            if (timerMatch) {
                step.timers.push({
                    duration: parseInt(timerMatch[1]),
                    unit: timerMatch[2] || 'Sek'
                });
            }

            const markerMatch = condition.match(this.patterns.marker);
            if (markerMatch) {
                step.markers.push({
                    name: markerMatch[1],
                    value: markerMatch[2] || ''
                });
            }

            const storingMatch = condition.match(this.patterns.storing);
            if (storingMatch) {
                step.storingen.push({
                    name: storingMatch[1],
                    description: storingMatch[2] || ''
                });
            }
        });

        this.result.steps.push(step);
    }
}