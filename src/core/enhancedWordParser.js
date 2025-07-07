// src/core/enhancedWordParser.js - Schone, werkende versie
import { buildFolderTree } from './hierarchyBuilder';
import { parseStandaardwerk } from './parser';

// Regex patterns
const PROGRAM_TITLE_REGEX = /^(.*?)\s+(FB|FC)(\d+)/i;
const SYMBOLIK_IDB_REGEX = /Symbolik\s+IDB\s*:\s*(.*)/i;
const TAG_REGEX = /<(h[1-6]|p)>(.*?)<\/\1>/g;

// Helper: strip HTML tags
const stripNestedTags = html => html?.replace(/<[^>]*>?/gm, '') || '';

// Helper: generate IDB name
function generateIdbName(programName) {
  if (!programName) return 'Generated_IDB';
  let name = programName
    .replace(/^[\d\.]+\s*/, '')
    .trim()
    .replace(/:/g, '_')
    .split(' ')
    .map((w, i) => i ? w[0].toUpperCase() + w.slice(1) : w)
    .join('');
  return name.replace(/[^a-zA-Z0-9_]/g, '') || 'Generated_IDB';
}

// Helper: detecteer variabele type
function detectVariableType(line) {
  const trimmed = line.trim();
  
  // Voorwaarde pattern: **naam:**
  if (/^\*\*([^:*]+):\s*/.test(trimmed)) {
    const match = /^\*\*([^:*]+):\s*(.*)/.exec(trimmed);
    return { type: 'voorwaarde', match: match };
  }
  
  // Storing pattern: **storing:**
  if (/^\*\*storing:\s*/i.test(trimmed)) {
    const match = /^\*\*storing:\s*(.*)/.exec(trimmed);
    return { type: 'storing', match: match };
  }
  
  // Melding pattern: **melding:**
  if (/^\*\*melding:\s*/i.test(trimmed)) {
    const match = /^\*\*melding:\s*(.*)/.exec(trimmed);
    return { type: 'melding', match: match };
  }
  
  // Teller pattern: **teller=**
  if (/^\*\*teller\s*=?\s*/i.test(trimmed)) {
    const match = /^\*\*teller\s*=?\s*(.*)/.exec(trimmed);
    return { type: 'teller', match: match };
  }
  
  // Tijd pattern: tijd ~5sek
  if (/^tijd\s*~?\s*\d+\s*(sek|min|s|m)/i.test(trimmed)) {
    const match = /^(tijd\s*~?\s*\d+\s*(?:sek|min|s|m))/i.exec(trimmed);
    return { type: 'tijd', match: match };
  }
  
  // Variable pattern: naam =
  if (/^([A-Za-z][A-Za-z0-9_]*)\s*=\s*/.test(trimmed)) {
    const match = /^([A-Za-z][A-Za-z0-9_]*)\s*=\s*(.*)/.exec(trimmed);
    return { type: 'variable', match: match };
  }
  
  return { type: 'unknown', match: null };
}

// Helper: converteer naar standaardwerk format
function convertToStandaardwerkFormat(rawContent, syntaxRules) {
  console.log('=== CONVERTING TO STANDAARDWERK ===');
  console.log('Raw content:', rawContent);
  
  const allRestWords = syntaxRules.stepKeywords.rest.map(w => w.toUpperCase());
  const allStepWords = syntaxRules.stepKeywords.step.map(w => w.toUpperCase());

  const lines = rawContent
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  console.log('Lines to process:', lines.length);

  // Parse structuur
  const sections = [];
  let currentSection = null;
  let pendingConditions = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const upper = line.toUpperCase();

    console.log(`Line ${i}: "${line}"`);

    // Check voor RUST
    const rustMatch = allRestWords.find(kw => upper.startsWith(kw));
    if (rustMatch) {
      console.log('-> RUST detected');
      // Save vorige sectie
      if (currentSection && pendingConditions.length > 0) {
        currentSection.conditions = [...pendingConditions];
        pendingConditions = [];
      }

      currentSection = {
        type: 'RUST',
        number: 0,
        description: line.replace(new RegExp(`^${rustMatch}:?\\s*`, 'i'), '').trim(),
        conditions: []
      };
      sections.push(currentSection);
      continue;
    }

    // Check voor STAP
    const stepRegex = new RegExp(`^(${allStepWords.join('|')})\\s+(\\d+):?\\s*(.*)`, 'i');
    const stepMatch = stepRegex.exec(line);
    if (stepMatch) {
      console.log(`-> STAP ${stepMatch[2]} detected`);
      // Save vorige sectie
      if (currentSection && pendingConditions.length > 0) {
        currentSection.conditions = [...pendingConditions];
        pendingConditions = [];
      }

      const [, keyword, number, description] = stepMatch;
      currentSection = {
        type: 'STAP',
        number: parseInt(number),
        description: description.trim(),
        conditions: []
      };
      sections.push(currentSection);
      continue;
    }

    // Check voor variabele
    const varType = detectVariableType(line);
    if (varType.type !== 'unknown') {
      console.log(`-> Variable ${varType.type} detected`);
      // Save vorige sectie
      if (currentSection && pendingConditions.length > 0) {
        currentSection.conditions = [...pendingConditions];
        pendingConditions = [];
      }

      currentSection = {
        type: 'variable',
        variableType: varType.type,
        name: varType.match ? (varType.match[1] || line) : line,
        conditions: []
      };
      sections.push(currentSection);
      continue;
    }

    // Anders: voorwaarde
    if (line.trim()) {
      console.log(`-> Condition: ${line.trim()}`);
      pendingConditions.push(line.trim());
    }
  }

  // Save laatste sectie
  if (currentSection && pendingConditions.length > 0) {
    currentSection.conditions = [...pendingConditions];
  }

  console.log('Sections found:', sections.length);
  console.log('Sections:', sections);

  // Converteer naar standaardwerk format
  const output = [];
  
  for (const section of sections) {
    if (section.type === 'RUST') {
      output.push(`RUST: ${section.description}`);
      // RUST krijgt standaard voorwaarden
      const stepSections = sections.filter(s => s.type === 'STAP');
      stepSections.forEach(step => {
        output.push(`\tNIET Stap[${step.number}]`);
      });
    } else if (section.type === 'STAP') {
      output.push(`STAP ${section.number}: ${section.description}`);
      // Voeg voorwaarden toe
      section.conditions.forEach(condition => {
        const isOr = condition.startsWith('+');
        if (isOr) {
          output.push(`\t+ ${condition.substring(1).trim()}`);
        } else {
          output.push(`\t${condition}`);
        }
      });
    } else if (section.type === 'variable') {
      output.push(`${section.name} =`);
      section.conditions.forEach(condition => {
        output.push(`\t${condition}`);
      });
    }
  }

  const result = output.join('\n');
  console.log('Final result:', result);
  return result;
}

export async function parseWordDocument(file, syntaxRules) {
  console.log('=== PARSING WORD DOCUMENT ===');
  
  const result = {
    hierarchy: null,
    programs: [],
    errors: [],
    warnings: [],
    statistics: {
      totalPrograms: 0,
      totalSteps: 0,
      totalVariables: 0,
      totalTimers: 0,
      totalMarkers: 0,
      totalStoringen: 0
    }
  };

  const seenFbNumbers = new Set();
  let currentProgram = null;
  const currentPath = [null, null, null, null, null, null];

  const saveCurrentProgram = () => {
    if (!currentProgram) return;

    console.log(`Saving program: ${currentProgram.name}`);
    console.log(`Raw content length: ${currentProgram.rawContent?.length || 0}`);

    try {
      // Converteer content
      const standardwerkContent = convertToStandaardwerkFormat(currentProgram.rawContent, syntaxRules);
      console.log('Converted content:', standardwerkContent);
      
      // Parse met main parser
      const fullParseResult = parseStandaardwerk(standardwerkContent, syntaxRules);
      console.log('Parse result:', fullParseResult);
      
      // Merge resultaten
      currentProgram = {
        ...currentProgram,
        name: currentProgram.name,
        type: currentProgram.type,
        fbNumber: currentProgram.fbNumber,
        idbName: currentProgram.idbName || generateIdbName(currentProgram.name),
        
        // Parse resultaten
        steps: fullParseResult.steps || [],
        variables: fullParseResult.variables || [],
        timers: fullParseResult.timers || [],
        markers: fullParseResult.markers || [],
        storingen: fullParseResult.storingen || [],
        
        transitionConditions: fullParseResult.transitionConditions || [],
        statistics: fullParseResult.statistics || {},
        
        errors: fullParseResult.errors || [],
        warnings: fullParseResult.warnings || [],
        
        rawContent: currentProgram.rawContent.trim(),
        processedContent: standardwerkContent,
        
        folderPath: currentProgram.path,
        fullTitle: currentProgram.fullTitle
      };

      console.log(`Program saved with ${currentProgram.steps.length} steps`);
      
      // Voeg parse errors toe
      if (currentProgram.errors.length > 0) {
        result.errors.push(...currentProgram.errors.map(e => ({
          program: currentProgram.name,
          ...e
        })));
      }

      result.programs.push(currentProgram);
    } catch (e) {
      console.error(`Error parsing program ${currentProgram.name}:`, e);
      result.warnings.push(`Analysefout in "${currentProgram.name}": ${e.message}`);
      
      // Voeg programma toe met fout
      currentProgram.parseError = e.message;
      currentProgram.steps = [];
      currentProgram.variables = [];
      currentProgram.timers = [];
      currentProgram.markers = [];
      currentProgram.storingen = [];
      result.programs.push(currentProgram);
    }

    currentProgram = null;
  };

  try {
    if (!window.mammoth) {
      throw new Error("Mammoth.js niet beschikbaar");
    }

    const options = {
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh",
        "p[style-name='Heading 5'] => h5:fresh",
        "p[style-name='Heading 6'] => h6:fresh",
      ]
    };

    const { value: html } = await window.mammoth.convertToHtml(
      { arrayBuffer: await file.arrayBuffer() },
      options
    );

    console.log('HTML extracted, length:', html.length);

    // Parse HTML
    const structured = [];
    let m;
    while ((m = TAG_REGEX.exec(html)) !== null) {
      structured.push({
        type: m[1],
        content: stripNestedTags(m[2]).trim()
      });
    }

    console.log('Structured elements:', structured.length);

    let started = false;
    let collectingContent = false;
    let contentBuffer = [];

    for (const item of structured) {
      if (!started && item.type.startsWith('h')) started = true;
      if (!started) continue;

      const txt = item.content;
      const programMatch = txt.match(PROGRAM_TITLE_REGEX);

      if (programMatch) {
        console.log('Found program:', txt);
        
        // Save vorige programma
        if (currentProgram && contentBuffer.length > 0) {
          currentProgram.rawContent = contentBuffer.join('\n');
          saveCurrentProgram();
        }

        // Start nieuw programma
        const lvl = item.type.startsWith('h') ? parseInt(item.type[1], 10) - 1 : -1;
        const pathCopy = [...currentPath];
        if (lvl >= 0) {
          for (let i = lvl + 1; i < pathCopy.length; i++) {
            pathCopy[i] = null;
          }
        }

        const [, name, type, numStr] = programMatch;
        const num = parseInt(numStr, 10);

        currentProgram = {
          path: pathCopy.filter(p => p),
          fullTitle: txt,
          name: name.trim(),
          type: type.toUpperCase(),
          fbNumber: num,
          idbName: null,
          rawContent: ''
        };

        contentBuffer = [];
        collectingContent = true;

        if (seenFbNumbers.has(num)) {
          result.warnings.push(`Dubbel FB/FC nummer ${num} bij "${name.trim()}"`);
        }
        seenFbNumbers.add(num);

      } else if (collectingContent && item.type === 'p') {
        // Voeg content toe
        const lines = txt.split('\n').map(l => l.trim()).filter(l => l);
        
        for (const line of lines) {
          // Check voor IDB
          const idbMatch = line.match(SYMBOLIK_IDB_REGEX);
          if (idbMatch && currentProgram) {
            currentProgram.idbName = idbMatch[1].trim();
          }
          
          contentBuffer.push(line);
        }
      }

      // Update path
      if (item.type.startsWith('h')) {
        const lvl = parseInt(item.type[1], 10) - 1;
        if (lvl >= 0 && lvl < currentPath.length) {
          currentPath[lvl] = txt.split('\t')[0];
          for (let j = lvl + 1; j < currentPath.length; j++) {
            currentPath[j] = null;
          }
        }
      }
    }

    // Save laatste programma
    if (currentProgram && contentBuffer.length > 0) {
      currentProgram.rawContent = contentBuffer.join('\n');
      saveCurrentProgram();
    }

    // Bouw hierarchy
    result.hierarchy = buildFolderTree(result.programs);

    // Update statistieken
    result.statistics = {
      totalPrograms: result.programs.length,
      totalSteps: result.programs.reduce((sum, p) => sum + (p.steps?.length || 0), 0),
      totalVariables: result.programs.reduce((sum, p) => sum + (p.variables?.length || 0), 0),
      totalTimers: result.programs.reduce((sum, p) => sum + (p.timers?.length || 0), 0),
      totalMarkers: result.programs.reduce((sum, p) => sum + (p.markers?.length || 0), 0),
      totalStoringen: result.programs.reduce((sum, p) => sum + (p.storingen?.length || 0), 0),
    };

    console.log('=== FINAL RESULT ===');
    console.log('Programs found:', result.programs.length);
    console.log('Total steps:', result.statistics.totalSteps);

  } catch (err) {
    console.error("Parser error:", err);
    result.errors.push(`Word document parsing failed: ${err.message}`);
  }

  return result;
}