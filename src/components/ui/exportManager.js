// src/components/ui/exportManager.js
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { generateTIAPortalXML } from '../../generator';

/**
 * Export Manager voor het genereren van ZIP bestanden met de complete projectstructuur
 */
export class ExportManager {
  constructor() {
    this.zip = new JSZip();
    this.callStatements = [];
    this.exportedFiles = [];
  }

  /**
   * Exporteer de geparseerde programma's naar een ZIP bestand
   * @param {Object} parsedDocument - Output van WordDocumentParser
   * @param {Object} options - Export opties
   */
  async exportToZip(parsedDocument, options = {}) {
    const defaultOptions = {
      generateIDBs: true,
      includeCallStatements: true,
      useChapterNumbers: true,
      includeProjectInfo: true,
      projectName: 'TIA-Portal-Export',
      ...options
    };

    try {
      // Genereer bestanden voor elk programma
      for (const program of parsedDocument.programs) {
        await this.processProgramma(program, defaultOptions);
      }

      // Voeg CALL statements toe
      if (defaultOptions.includeCallStatements && this.callStatements.length > 0) {
        const callContent = this.generateCallStatementsFile();
        this.zip.file('CALL_Statements.txt', callContent);
      }

      // Voeg project info toe
      if (defaultOptions.includeProjectInfo) {
        const projectInfo = this.generateProjectInfo(parsedDocument, defaultOptions);
        this.zip.file('project-info.json', JSON.stringify(projectInfo, null, 2));
      }

      // Genereer en download ZIP
      const blob = await this.zip.generateAsync({ type: 'blob' });
      saveAs(blob, `${defaultOptions.projectName}.zip`);

      return {
        success: true,
        filesExported: this.exportedFiles.length,
        errors: []
      };
    } catch (error) {
      return {
        success: false,
        filesExported: 0,
        errors: [`Export fout: ${error.message}`]
      };
    }
  }

  /**
   * Verwerk een enkel programma
   */
  async processProgramma(program, options) {
    // Parse de content met de bestaande parser
    const parseResult = await this.parseProgramContent(program);
    
    // Bepaal het pad in de ZIP
    const folderPath = this.buildFolderPath(program.path || program.folderPath);
    
    // Genereer bestandsnaam
    const baseName = options.useChapterNumbers && program.hoofdstukNummer
      ? `${program.hoofdstukNummer} ${program.name}`
      : program.name;
    
    // Genereer en save FB XML
    const fbXml = this.generateFBXml(program, parseResult);
    const fbFileName = `${baseName} ${program.type}${program.fbNumber}.xml`;
    this.zip.file(`${folderPath}/${fbFileName}`, fbXml);
    this.exportedFiles.push(`${folderPath}/${fbFileName}`);

    // Genereer en save IDB XML indien nodig
    if (options.generateIDBs && program.type === 'FB' && program.idbName) {
      const idbXml = this.generateIDBXml(program);
      const idbFileName = `${baseName} ${program.idbName} DB${program.fbNumber}.xml`;
      this.zip.file(`${folderPath}/${idbFileName}`, idbXml);
      this.exportedFiles.push(`${folderPath}/${idbFileName}`);
    }

    // Voeg CALL statement toe
    this.addCallStatement(program, baseName);
  }

  /**
   * Parse programma content met bestaande parser
   */
  async parseProgramContent(program) {
    // Als het programma al volledig geparsed is (van enhanced parser), gebruik die data
    if (program.steps && program.steps.length > 0) {
      return {
        functionBlock: `${program.type}${program.fbNumber}`,
        programName: program.name || program.naam,
        symbolikIDB: program.idbName || program.symbolikIDB,
        steps: program.steps,
        variables: program.variables || [],
        timers: program.timers || [],
        markers: program.markers || [],
        storingen: program.storingen || [],
        errors: program.errors || [],
        statistics: program.statistics || {
          totalSteps: program.steps.length,
          totalConditions: 0,
          totalVariables: program.variables?.length || 0,
          externalReferences: 0,
          complexityScore: 0
        }
      };
    }
    
    // Anders, gebruik de fallback
    return {
      functionBlock: `${program.type}${program.fbNumber}`,
      programName: program.naam,
      symbolikIDB: program.symbolikIDB,
      steps: this.extractStepsFromContent(program.content),
      errors: [],
      statistics: {
        totalSteps: 0,
        totalConditions: 0,
        totalVariables: 0,
        externalReferences: 0,
        complexityScore: 0
      }
    };
  }

  /**
   * Extract stappen uit de content (simplified versie)
   */
  extractStepsFromContent(content) {
    const steps = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      // Detecteer RUST
      if (line.match(/^\*\*RUST\*\*:?/)) {
        steps.push({
          number: 0,
          type: 'RUST',
          description: line.replace(/^\*\*RUST\*\*:?\s*/, '').trim()
        });
      }
      // Detecteer STAP
      else if (line.match(/^\*\*STAP\s+(\d+)\*\*:?/)) {
        const match = line.match(/^\*\*STAP\s+(\d+)\*\*:?\s*(.*)/);
        if (match) {
          steps.push({
            number: parseInt(match[1]),
            type: 'STAP',
            description: match[2].trim()
          });
        }
      }
    }

    return steps;
  }

  /**
   * Genereer FB XML
   */
  generateFBXml(program, parseResult) {
    // Gebruik de bestaande generator
    const xmlContent = generateTIAPortalXML(parseResult);
    return xmlContent;
  }

  /**
   * Genereer IDB XML
   */
  generateIDBXml(program) {
    // Genereer een basis IDB XML
    const instanceOfName = program.hoofdstukNummer 
      ? `${program.hoofdstukNummer} ${program.name}`
      : program.name;
      
    return `<?xml version="1.0" encoding="utf-8"?>
<Document>
  <Engineering version="V18" />
  <SW.Blocks.InstanceDB ID="0">
    <AttributeList>
      <AutoNumber>false</AutoNumber>
      <InstanceOfName>${instanceOfName}</InstanceOfName>
      <InstanceOfType>FB</InstanceOfType>
      <Interface><Sections xmlns="http://www.siemens.com/automation/Openness/SW/Interface/v5">
  <Section Name="Input" />
  <Section Name="Output">
    <Member Name="Uit_Stap_Tekst" Datatype="Int" />
  </Section>
  <Section Name="InOut" />
  <Section Name="Static">
    <Member Name="Stap" Datatype="Array[0..31] of Bool" Remanence="Retain" />
    <Member Name="Stap_A" Datatype="Array[0..31] of Bool" Remanence="Retain" />
    <Member Name="Stap_B" Datatype="Array[0..31] of Bool" Remanence="Retain" />
    <Member Name="Stap_C" Datatype="Array[0..31] of Bool" Remanence="Retain" />
    <Member Name="Hulp" Datatype="Array[1..32] of Bool" Remanence="Retain" />
    <Member Name="Tijd" Datatype="Array[1..10] of IEC_TIMER" Version="1.0" Remanence="Retain">
      <AttributeList>
        <BooleanAttribute Name="SetPoint" SystemDefined="true">true</BooleanAttribute>
      </AttributeList>
    </Member>
    <Member Name="Teller" Datatype="Array[1..10] of Int" Remanence="Retain" />
    <Member Name="Melding" Datatype="Array[0..2] of &quot;Program Alarm Message&quot;" />
  </Section>
</Sections></Interface>
      <Name>${program.idbName}</Name>
      <Namespace />
      <Number>${program.fbNumber}</Number>
      <ProgrammingLanguage>DB</ProgrammingLanguage>
    </AttributeList>
    <ObjectList>
      <MultilingualText ID="1" CompositionName="Comment">
        <ObjectList>
          <MultilingualTextItem ID="2" CompositionName="Items">
            <AttributeList>
              <Culture>nl-NL</Culture>
              <Text />
            </AttributeList>
          </MultilingualTextItem>
          <MultilingualTextItem ID="3" CompositionName="Items">
            <AttributeList>
              <Culture>en-GB</Culture>
              <Text />
            </AttributeList>
          </MultilingualTextItem>
        </ObjectList>
      </MultilingualText>
      <MultilingualText ID="4" CompositionName="Title">
        <ObjectList>
          <MultilingualTextItem ID="5" CompositionName="Items">
            <AttributeList>
              <Culture>nl-NL</Culture>
              <Text />
            </AttributeList>
          </MultilingualTextItem>
          <MultilingualTextItem ID="6" CompositionName="Items">
            <AttributeList>
              <Culture>en-GB</Culture>
              <Text />
            </AttributeList>
          </MultilingualTextItem>
        </ObjectList>
      </MultilingualText>
    </ObjectList>
  </SW.Blocks.InstanceDB>
</Document>`;
  }

  /**
   * Bouw folder pad op basis van hierarchy
   */
  buildFolderPath(path) {
    // Verwijder lege segmenten en join met /
    if (!path) return '';
    return path.filter(segment => segment).join('/');
  }

  /**
   * Voeg CALL statement toe
   */
  addCallStatement(program, baseName) {
    const instanceName = program.idbName || `${program.name}_DB`;
    const statusPath = `"Status".Staptekst_${this.sanitizeName(program.name)}`;
    
    this.callStatements.push({
      path: program.path || program.folderPath || [],
      statement: `CALL "${baseName}", "${instanceName}"\n   Uit_Stap_Tekst:=${statusPath}`
    });
  }

  /**
   * Genereer CALL statements bestand
   */
  generateCallStatementsFile() {
    let content = '// Automatisch gegenereerde CALL statements\n';
    content += '// Gegenereerd op: ' + new Date().toLocaleString('nl-NL') + '\n\n';

    // Groepeer per hoofdstuk
    const grouped = {};
    for (const call of this.callStatements) {
      const chapter = (call.path && call.path[0]) || 'Onbekend';
      if (!grouped[chapter]) {
        grouped[chapter] = [];
      }
      grouped[chapter].push(call.statement);
    }

    // Genereer output
    for (const [chapter, statements] of Object.entries(grouped)) {
      content += `// ${chapter}\n`;
      content += statements.join('\n\n');
      content += '\n\n';
    }

    return content;
  }

  /**
   * Genereer project info
   */
  generateProjectInfo(parsedDocument, options) {
    return {
      projectName: options.projectName,
      exportDate: new Date().toISOString(),
      statistics: {
        totalPrograms: parsedDocument.programs.length,
        totalFBs: parsedDocument.programs.filter(p => p.type === 'FB').length,
        totalFCs: parsedDocument.programs.filter(p => p.type === 'FC').length,
        totalIDBs: parsedDocument.programs.filter(p => p.idbName).length
      },
      structure: this.buildHierarchyInfo(parsedDocument.hierarchy),
      exportOptions: options,
      errors: parsedDocument.errors,
      warnings: parsedDocument.warnings
    };
  }

  /**
   * Bouw hierarchy info voor project metadata
   */
  buildHierarchyInfo(hierarchy, level = 0) {
    const info = {};
    
    if (!hierarchy || !hierarchy.children) return info;
    
    for (const [key, value] of Object.entries(hierarchy.children)) {
      info[key] = {
        programs: value.programs ? value.programs.length : 0,
        children: value.children ? this.buildHierarchyInfo(value, level + 1) : {}
      };
    }
    
    return info;
  }

  /**
   * Sanitize naam voor gebruik in identifiers
   */
  sanitizeName(name) {
    return name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_');
  }
}

/**
 * Helper functie voor direct gebruik
 */
export async function exportParsedDocument(parsedDocument, options) {
  const exporter = new ExportManager();
  return await exporter.exportToZip(parsedDocument, options);
}