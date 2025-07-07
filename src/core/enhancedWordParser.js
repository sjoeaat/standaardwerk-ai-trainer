// src/core/enhancedWordParser.js
import * as mammoth from 'mammoth';
import { buildFolderTree } from './hierarchyBuilder';
import { parseStandaardwerk } from './parser';

// Regex patterns
const PROGRAM_TITLE_REGEX = /^(.*?)\s+(FB|FC)(\d+)/i;
const SYMBOLIK_IDB_REGEX = /Symbolik\s+IDB\s*:\s*(.*)/i;
const TAG_REGEX = /<(h[1-6]|p)>(.*?)<\/\1>/g;

// Helper: strip HTML tags
const stripNestedTags = html =>
  html?.replace(/<[^>]*>?/gm, '') || '';

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

// Helper: converteer Word content naar standaardwerk format
function convertToStandaardwerkFormat(rawContent, syntaxRules) {
    const allRestWords = syntaxRules.stepKeywords.rest.map(w => w.toUpperCase());
    const allStepWords = syntaxRules.stepKeywords.step.map(w => w.toUpperCase());
  
    const lines = rawContent
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean);
  
    const outputLines = [];
    let insideStep = false;
  
    for (const line of lines) {
      const upper = line.toUpperCase();
  
      const rustMatch = allRestWords.find(word => upper.startsWith(word));
      const stepMatch = allStepWords.find(word => upper.startsWith(word));
  
      if (rustMatch) {
        outputLines.push(`\t${line}`); // RUST of IDLE mag ook met tab, blijft apart
        insideStep = true;
        continue;
      }
  
      const stepNumberMatch = line.match(new RegExp(`^(${allStepWords.join('|')})\\s+\\d+`, 'i'));
      if (stepNumberMatch) {
        outputLines.push(`${line}`); // nieuwe stap, zonder tab
        insideStep = true;
        continue;
      }
  
      if (insideStep) {
        if (line.startsWith('+')) {
          outputLines.push(`\t${line.trim()}`);
        } else {
          outputLines.push(`\t${line}`);
        }
      } else {
        outputLines.push(line);
      }
    }
  
    return outputLines.join('\n');
  }
  

export async function parseWordDocument(file, syntaxRules) {
  const result = {
    hierarchy: null,
    programs: [],
    errors: [],
    warnings: [],
  };

  const seenFbNumbers = new Set();
  let currentProgram = null;
  const currentPath = [null, null, null, null, null, null];

  const saveCurrentProgram = () => {
    if (!currentProgram) return;

    try {
      // Converteer de content naar het juiste format
      const standardwerkContent = convertToStandaardwerkFormat(currentProgram.rawContent, syntaxRules);
      
      // Parse met de volledige parseStandaardwerk functie
      const fullParseResult = parseStandaardwerk(standardwerkContent, syntaxRules);
      
      // Merge de volledige parse resultaten met het programma
      currentProgram = {
        ...currentProgram,
        // Basis info behouden
        name: currentProgram.name,
        type: currentProgram.type,
        fbNumber: currentProgram.fbNumber,
        idbName: currentProgram.idbName || generateIdbName(currentProgram.name),
        
        // Volledige parse resultaten toevoegen
        steps: fullParseResult.steps || [],
        variables: fullParseResult.variables || [],
        timers: fullParseResult.timers || [],
        markers: fullParseResult.markers || [],
        storingen: fullParseResult.storingen || [],
        
        // Extra info uit parser
        transitionConditions: fullParseResult.transitionConditions || [],
        statistics: fullParseResult.statistics || {},
        
        // Parse errors/warnings toevoegen aan programma
        errors: fullParseResult.errors || [],
        warnings: fullParseResult.warnings || [],
        
        // Originele content behouden voor debug
        rawContent: currentProgram.rawContent.trim(),
        processedContent: standardwerkContent,
        
        // Folder info
        folderPath: currentProgram.path,
        fullTitle: currentProgram.fullTitle
      };

      // Voeg parse errors toe aan globale errors
      if (currentProgram.errors.length > 0) {
        result.errors.push(...currentProgram.errors.map(e => ({
          program: currentProgram.name,
          ...e
        })));
      }

      result.programs.push(currentProgram);
    } catch (e) {
      result.warnings.push(`Analysefout in "${currentProgram.name}": ${e.message}`);
      // Voeg programma toch toe, maar met foutindicatie
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

    // Parse HTML structuur
    const structured = [];
    let m;
    while ((m = TAG_REGEX.exec(html)) !== null) {
      structured.push({
        type: m[1],
        content: stripNestedTags(m[2]).trim()
      });
    }

    let started = false;
    let collectingContent = false;
    let contentBuffer = [];

    for (const item of structured) {
      if (!started && item.type.startsWith('h')) started = true;
      if (!started) continue;

      const txt = item.content;
      const programMatch = txt.match(PROGRAM_TITLE_REGEX);

      if (programMatch) {
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
        // Voeg content toe aan buffer
        const lines = txt.split('\n').map(l => l.trim()).filter(l => l);
        
        for (const line of lines) {
          // Check voor Symbolik IDB
          const idbMatch = line.match(SYMBOLIK_IDB_REGEX);
          if (idbMatch && currentProgram) {
            currentProgram.idbName = idbMatch[1].trim();
          }
          
          // Voeg alle content toe
          contentBuffer.push(line);
        }
      }

      // Update path voor hierarchy
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

    // Voeg globale statistieken toe
    result.statistics = {
      totalPrograms: result.programs.length,
      totalSteps: result.programs.reduce((sum, p) => sum + (p.steps?.length || 0), 0),
      totalVariables: result.programs.reduce((sum, p) => sum + (p.variables?.length || 0), 0),
      totalTimers: result.programs.reduce((sum, p) => sum + (p.timers?.length || 0), 0),
      totalMarkers: result.programs.reduce((sum, p) => sum + (p.markers?.length || 0), 0),
      totalStoringen: result.programs.reduce((sum, p) => sum + (p.storingen?.length || 0), 0),
    };

  } catch (err) {
    console.error("Parser fout:", err);
    result.errors.push(`Lezen Word-document mislukt: ${err.message}`);
  }

  return result;
}

// Enhanced export functie die ook de volledige parse data meeneemt
export function enrichProgramForExport(program, syntaxRules) {
  // Als het programma al volledig geparsed is, return as-is
  if (program.steps && program.steps.length > 0) {
    return program;
  }

  // Anders, parse het opnieuw
  try {
    const standardwerkContent = convertToStandaardwerkFormat(program.rawContent, syntaxRules);
    const fullParseResult = parseStandaardwerk(standardwerkContent, syntaxRules);
    
    return {
      ...program,
      ...fullParseResult,
      name: program.name,
      type: program.type,
      fbNumber: program.fbNumber,
      idbName: program.idbName
    };
  } catch (e) {
    console.error(`Error parsing program ${program.name}:`, e);
    return program;
  }
}