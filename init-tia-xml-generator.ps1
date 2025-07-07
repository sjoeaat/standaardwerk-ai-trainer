# PowerShell Script om de TIA Portal XML Generator projectstructuur op te zetten.
# Voer dit script uit in de root van je project.

# Stopt het script bij de eerste fout.
$ErrorActionPreference = "Stop"

# Maak de mappenstructuur aan. De -Force parameter voorkomt fouten als de map al bestaat.
Write-Host "Mappenstructuur aanmaken: src/components..."
New-Item -ItemType Directory -Force -Path "src\components" | Out-Null

# --- Schrijf de individuele TypeScript bestanden ---

# src/interfaces.ts
Write-Host "Bestand aanmaken: src/interfaces.ts"
@"
/**
 * De input-structuur die de generator verwacht.
 */
export interface Step {
  number: number;
  type: 'STAP' | 'RUST';
  description?: string;
}

export interface ParseResult {
  functionBlock?: string;
  steps: Step[];
}

/**
 * Een interface voor elk object dat naar een XML-string kan worden omgezet.
 */
export interface IXmlComponent {
  toXml(pretty?: boolean, level?: number): string;
}
"@ | Set-Content -Encoding UTF8 -Path "src/interfaces.ts"

# src/uid-manager.ts
Write-Host "Bestand aanmaken: src/uid-manager.ts"
@"
/**
 * Beheert het genereren van unieke, opeenvolgende IDs binnen een document.
 * Start standaard op 0.
 */
export class UidManager {
  private currentId: number;

  constructor(startId: number = 0) {
    this.currentId = startId;
  }

  /**
   * Geeft het volgende unieke ID terug en verhoogt de interne teller.
   */
  public next(): number {
    return this.currentId++;
  }
}
"@ | Set-Content -Encoding UTF8 -Path "src/uid-manager.ts"

# src/xml-builder.ts
Write-Host "Bestand aanmaken: src/xml-builder.ts"
@'
/**
 * Een simpele helper klasse om XML-elementen te bouwen.
 * Dit vervangt de noodzaak voor string-concatenatie.
 */
export class XmlElement {
  private children: (XmlElement | string)[] = [];
  private attributes: { [key: string]: string | number | boolean } = {};

  constructor(public name: string, ...children: (XmlElement | string)[]) {
    this.children = children;
  }

  public add(child: XmlElement | string) {
    this.children.push(child);
    return this;
  }

  public attr(key: string, value: string | number | boolean | undefined) {
    if (value !== undefined && value !== null) {
      this.attributes[key] = value;
    }
    return this;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  public toString(pretty: boolean = true, level: number = 0): string {
    const indent = pretty ? '  '.repeat(level) : '';
    const attrs = Object.entries(this.attributes)
      .map(([key, value]) => `${key}="${this.escapeXml(String(value))}"`)
      .join(' ');

    const openTag = `${indent}<${this.name}${attrs ? ' ' + attrs : ''}`;

    if (this.children.length === 0) {
      return `${openTag} />`;
    }

    const childrenXml = this.children
      .map(child =>
        typeof child === 'string'
          ? (pretty ? indent + '  ' : '') + this.escapeXml(child)
          : child.toString(pretty, level + 1)
      )
      .join(pretty ? '\n' : '');

    return `${openTag}>${pretty ? '\n' : ''}${childrenXml}${pretty ? '\n' + indent : ''}</${this.name}>`;
  }
}
'@ | Set-Content -Encoding UTF8 -Path "src/xml-builder.ts"

# src/components/xml-component.ts
Write-Host "Bestand aanmaken: src/components/xml-component.ts"
@"
import { IXmlComponent } from '../interfaces';
import { UidManager } from '../uid-manager';

/**
 * Abstracte basisklasse voor alle TIA-componenten.
 */
export abstract class XmlComponent implements IXmlComponent {
  constructor(protected uidManager: UidManager) {}
  abstract toXml(pretty?: boolean, level?: number): string;
}
"@ | Set-Content -Encoding UTF8 -Path "src/components/xml-component.ts"

# src/components/multilingual-text.ts
Write-Host "Bestand aanmaken: src/components/multilingual-text.ts"
@'
import { UidManager } from '../uid-manager';
import { XmlElement } from '../xml-builder';
import { XmlComponent } from './xml-component';

export class MultilingualText extends XmlComponent {
  private texts: { lang: string; text: string }[] = [];
  private id: number;

  constructor(
    uidManager: UidManager,
    private compositionName: 'Comment' | 'Title',
    initialText: string = ''
  ) {
    super(uidManager);
    this.id = this.uidManager.next();
    if (initialText) {
      this.addText(initialText, 'nl-NL');
      this.addText(initialText, 'en-GB');
    } else {
        // Zorg ervoor dat er altijd lege entries zijn, zoals in het origineel
        this.addText('', 'nl-NL');
        this.addText('', 'en-GB');
    }
  }

  public addText(text: string, lang: string) {
    this.texts.push({ lang, text });
    return this;
  }

  toXml(pretty: boolean = true, level: number = 0): string {
    const objectList = new XmlElement('ObjectList');
    this.texts.forEach(({ lang, text }) => {
      const item = new XmlElement('MultilingualTextItem')
        .attr('ID', this.uidManager.next())
        .attr('CompositionName', 'Items');
      
      const attrList = new XmlElement('AttributeList')
        .add(new XmlElement('Culture', lang))
        .add(new XmlElement('Text', text));
        
      item.add(attrList);
      objectList.add(item);
    });

    const multiText = new XmlElement('MultilingualText')
      .attr('ID', this.id)
      .attr('CompositionName', this.compositionName)
      .add(objectList);

    return multiText.toString(pretty, level);
  }
}
'@ | Set-Content -Encoding UTF8 -Path "src/components/multilingual-text.ts"

# src/components/part.ts
Write-Host "Bestand aanmaken: src/components/part.ts"
@'
import { UidManager } from '../uid-manager';
import { XmlElement } from '../xml-builder';
import { XmlComponent } from './xml-component';

/**
 * Representeert een generiek FBD/LAD-blok zoals een Coil, Contact, of SR.
 */
export class Part extends XmlComponent {
  public readonly id: number;
  public readonly name: string;
  public readonly inputs: string[];
  public readonly outputs: string[];

  constructor(uidManager: UidManager, name: string, definition: { inputs: string[], outputs: string[] }) {
    super(uidManager);
    this.id = this.uidManager.next();
    this.name = name;
    this.inputs = definition.inputs;
    this.outputs = definition.outputs;
  }

  toXml(pretty: boolean = true, level: number = 0): string {
    return new XmlElement('Part')
      .attr('Name', this.name)
      .attr('UId', this.id)
      .toString(pretty, level);
  }
}

/**
 * Een speciaal blok voor het benaderen van variabelen.
 */
export class Access extends XmlComponent {
    public readonly id: number;

    constructor(uidManager: UidManager, private variable: string, private index: number) {
        super(uidManager);
        this.id = this.uidManager.next();
    }

    toXml(pretty?: boolean, level?: number = 0): string {
        const constant = new XmlElement('Constant')
            .add(new XmlElement('ConstantType', 'DInt'))
            .add(new XmlElement('ConstantValue', String(this.index)));

        const innerAccess = new XmlElement('Access')
            .attr('Scope', 'LiteralConstant')
            .add(constant);

        const component = new XmlElement('Component')
            .attr('Name', this.variable)
            .attr('AccessModifier', 'Array')
            .add(innerAccess);
        
        const symbol = new XmlElement('Symbol').add(component);

        return new XmlElement('Access')
            .attr('Scope', 'LocalVariable')
            .attr('UId', this.id)
            .add(symbol)
            .toString(pretty, level);
    }
}
'@ | Set-Content -Encoding UTF8 -Path "src/components/part.ts"

# src/components/wire.ts
Write-Host "Bestand aanmaken: src/components/wire.ts"
@'
import { UidManager } from '../uid-manager';
import { XmlElement } from '../xml-builder';
import { XmlComponent } from './xml-component';

export class Wire extends XmlComponent {
  public readonly id: number;

  constructor(
    uidManager: UidManager,
    private from: { partId: number; port?: string },
    private to: { partId: number; port: string }
  ) {
    super(uidManager);
    this.id = this.uidManager.next();
  }

  toXml(pretty: boolean = true, level: number = 0): string {
    const wire = new XmlElement('Wire').attr('UId', this.id);

    // Als 'from' geen poort heeft, is het een IdentCon. Anders is het een NameCon.
    if (this.from.port) {
        wire.add(new XmlElement('NameCon').attr('UId', this.from.partId).attr('Name', this.from.port));
    } else {
        wire.add(new XmlElement('IdentCon').attr('UId', this.from.partId));
    }
    
    wire.add(new XmlElement('NameCon').attr('UId', this.to.partId).attr('Name', this.to.port));

    return wire.toString(pretty, level);
  }
}
'@ | Set-Content -Encoding UTF8 -Path "src/components/wire.ts"

# src/components/network.ts
Write-Host "Bestand aanmaken: src/components/network.ts"
@"
import { UidManager } from '../uid-manager';
import { XmlElement } from '../xml-builder';
import { MultilingualText } from './multilingual-text';
import { Access, Part } from './part';
import { Wire } from './wire';
import { XmlComponent } from './xml-component';

/**
 * Representeert een `CompileUnit`, oftewel één netwerk.
 */
export class Network extends XmlComponent {
  private id: number;
  private parts: (Part | Access)[] = [];
  private wires: Wire[] = [];
  private title: MultilingualText;
  private comment: MultilingualText;
  
  // Definitie van beschikbare blokken. Dit kan uit een JSON-bestand komen.
  private static readonly partDefinitions = {
      ""SR"": { inputs: [""S"", ""R""], outputs: [""Q""] },
      ""Coil"": { inputs: [""In""], outputs: [] },
      ""Contact"": { inputs: [], outputs: [""Out""] },
  };

  constructor(uidManager: UidManager, title: string) {
    super(uidManager);
    this.id = this.uidManager.next();
    this.title = new MultilingualText(this.uidManager, 'Title', title);
    this.comment = new MultilingualText(this.uidManager, 'Comment');
  }

  /**
   * Voegt een standaard FBD blok toe aan het netwerk.
   */
  addPart(name: keyof typeof Network.partDefinitions): Part {
    const definition = Network.partDefinitions[name];
    if (!definition) {
      throw new Error(`Part definition for '`$name`' not found.`);
    }
    const part = new Part(this.uidManager, name, definition);
    this.parts.push(part);
    return part;
  }

  /**
   * Voegt een variabele-toegang toe aan het netwerk.
   */
  addAccess(variable: string, index: number): Access {
      const access = new Access(this.uidManager, variable, index);
      this.parts.push(access);
      return access;
  }

  /**
   * Verbindt twee componenten met elkaar.
   */
  connect(from: Part | Access, fromPort: string | undefined, to: Part | Access, toPort: string) {
    const wire = new Wire(this.uidManager, { partId: from.id, port: fromPort }, { partId: to.id, port: toPort });
    this.wires.push(wire);
    return this;
  }

  toXml(pretty: boolean = true, level: number = 0): string {
    const partsContainer = new XmlElement('Parts');
    this.parts.forEach(p => partsContainer.add(p.toXml(pretty, level + 5)));
    
    const wiresContainer = new XmlElement('Wires');
    this.wires.forEach(w => wiresContainer.add(w.toXml(pretty, level + 5)));

    const flgNet = new XmlElement('FlgNet')
      .attr('xmlns', 'http://www.siemens.com/automation/Openness/SW/NetworkSource/FlgNet/v4')
      .add(partsContainer)
      .add(wiresContainer);

    const networkSource = new XmlElement('NetworkSource').add(flgNet);
    
    const attributeList = new XmlElement('AttributeList')
        .add(networkSource)
        .add(new XmlElement('ProgrammingLanguage', 'FBD'));

    const objectList = new XmlElement('ObjectList')
        .add(this.comment.toXml(pretty, level + 3))
        .add(this.title.toXml(pretty, level + 3));

    return new XmlElement('SW.Blocks.CompileUnit')
      .attr('ID', this.id)
      .attr('CompositionName', 'CompileUnits')
      .add(attributeList)
      .add(objectList)
      .toString(pretty, level);
  }
}
"@ | Set-Content -Encoding UTF8 -Path "src/components/network.ts"

# src/components/fb.ts
Write-Host "Bestand aanmaken: src/components/fb.ts"
@"
import { UidManager } from '../uid-manager';
import { XmlElement } from '../xml-builder';
import { MultilingualText } from './multilingual-text';
import { Network } from './network';
import { XmlComponent } from './xml-component';

/**
 * Representeert een `SW.Blocks.FB`.
 */
export class FunctionBlock extends XmlComponent {
  private id: number;
  private networks: Network[] = [];
  private name: string;
  private number: number;
  private comment: MultilingualText;
  private title: MultilingualText;
  private interfaceXml: string; // Voor nu, houd de interface XML statisch

  constructor(uidManager: UidManager, name: string) {
    super(uidManager);
    this.id = this.uidManager.next();
    this.name = name;
    this.number = parseInt(name.replace(/[^0-9]/g, '')) || 1;
    this.comment = new MultilingualText(this.uidManager, 'Comment');
    this.title = new MultilingualText(this.uidManager, 'Title');
    
    // Hardcoded interface van het voorbeeld. Dit kan worden uitgebreid met een eigen builder.
    this.interfaceXml = `
    <Interface><Sections xmlns=""http://www.siemens.com/automation/Openness/SW/Interface/v5"">
  <Section Name=""Input"" />
  <Section Name=""Output"">
    <Member Name=""Uit_Stap_Tekst"" Datatype=""Int"" />
  </Section>
  <Section Name=""InOut"" />
  <Section Name=""Static"">
    <Member Name=""Stap"" Datatype=""Array[0..31] of Bool"" Remanence=""Retain"">
      <Subelement Path=""0"">
        <Comment>
          <MultiLanguageText Lang=""nl-NL"">stap 0</MultiLanguageText>
        </Comment>
      </Subelement>
      <Subelement Path=""1"">
        <Comment>
          <MultiLanguageText Lang=""nl-NL"">stap1</MultiLanguageText>
        </Comment>
      </Subelement>
      <Subelement Path=""2"">
        <Comment>
          <MultiLanguageText Lang=""nl-NL"">stap2</MultiLanguageText>
        </Comment>
      </Subelement>
      <Subelement Path=""31"">
        <Comment>
          <MultiLanguageText Lang=""nl-NL"">stap31</MultiLanguageText>
        </Comment>
      </Subelement>
    </Member>
    <Member Name=""Stap_A"" Datatype=""Array[0..31] of Bool"" Remanence=""Retain"" />
    <Member Name=""Stap_B"" Datatype=""Array[0..31] of Bool"" Remanence=""Retain"" />
    <Member Name=""Stap_C"" Datatype=""Array[0..31] of Bool"" Remanence=""Retain"" />
    <Member Name=""Hulp"" Datatype=""Array[1..32] of Bool"" Remanence=""Retain"">
      <Comment>
        <MultiLanguageText Lang=""nl-NL"">Hulpmerker</MultiLanguageText>
        <MultiLanguageText Lang=""en-GB"">Auxilliary bit</MultiLanguageText>
      </Comment>
    </Member>
    <Member Name=""Tijd"" Datatype=""Array[1..10] of IEC_TIMER"" Version=""1.0"" Remanence=""Retain"">
      <AttributeList>
        <BooleanAttribute Name=""SetPoint"" SystemDefined=""true"">true</BooleanAttribute>
      </AttributeList>
    </Member>
    <Member Name=""Teller"" Datatype=""Array[1..10] of Int"" Remanence=""Retain"" />
  </Section>
  <Section Name=""Temp"">
    <Member Name=""Temp_Stap_Tekst"" Datatype=""Int"" />
    <Member Name=""SET-Voorwaarde"" Datatype=""Bool"" />
    <Member Name=""Storingsbit_DB8010"" Datatype=""Bool"">
      <Comment>
        <MultiLanguageText Lang=""nl-NL"">Wissel deze temp uit door bitje uit DB8010</MultiLanguageText>
        <MultiLanguageText Lang=""en-GB"">Exchange this temporary with DB8010</MultiLanguageText>
      </Comment>
    </Member>
    <Member Name=""Hand_Temp"" Datatype=""Bool"" />
    <Member Name=""i"" Datatype=""Int"" />
  </Section>
  <Section Name=""Constant"" />
</Sections></Interface>`;
  }

  addNetwork(title: string): Network {
    const network = new Network(this.uidManager, title);
    this.networks.push(network);
    return network;
  }

  toXml(pretty: boolean = true, level: number = 0): string {
    const attrList = new XmlElement('AttributeList')
        .add(new XmlElement('AutoNumber', 'false'))
        .add(this.interfaceXml) // Voeg de statische interface XML hier toe
        .add(new XmlElement('IsRetainMemResEnabled', 'true'))
        .add(new XmlElement('MemoryLayout', 'Optimized'))
        .add(new XmlElement('MemoryReserve', '4000'))
        .add(new XmlElement('Name', this.name))
        .add(new XmlElement('Namespace'))
        .add(new XmlElement('Number', this.number))
        .add(new XmlElement('ProgrammingLanguage', 'FBD'))
        .add(new XmlElement('RetainMemoryReserve', '4000'))
        .add(new XmlElement('SetENOAutomatically', 'true'));

    const objectList = new XmlElement('ObjectList')
        .add(this.comment.toXml(pretty, level + 3));
    
    this.networks.forEach(n => objectList.add(n.toXml(pretty, level + 3)));
    
    objectList.add(this.title.toXml(pretty, level + 3));

    return new XmlElement('SW.Blocks.FB')
      .attr('ID', this.id)
      .add(attrList)
      .add(objectList)
      .toString(pretty, level);
  }
}
"@ | Set-Content -Encoding UTF8 -Path "src/components/fb.ts"

# src/components/document.ts
Write-Host "Bestand aanmaken: src/components/document.ts"
@"
import { UidManager } from '../uid-manager';
import { XmlElement } from '../xml-builder';
import { FunctionBlock } from './fb';
import { XmlComponent } from './xml-component';

/**
 * Representeert het top-level `<Document>` object.
 */
export class Document extends XmlComponent {
  private fb: FunctionBlock | null = null;

  constructor() {
    // Het hoofddocument start zijn eigen UidManager
    super(new UidManager(0));
  }

  addFb(name: string): FunctionBlock {
    this.fb = new FunctionBlock(this.uidManager, name);
    return this.fb;
  }

  toXml(pretty: boolean = true, level: number = 0): string {
    const doc = new XmlElement('Document')
        .add(new XmlElement('Engineering').attr('version', 'V18'));

    if (this.fb) {
        doc.add(this.fb.toXml(pretty, level + 1));
    }
    
    const declaration = '<?xml version="1.0" encoding="utf-8"?>\n';
    return declaration + doc.toString(pretty, level);
  }
}
"@ | Set-Content -Encoding UTF8 -Path "src/components/document.ts"

# src/index.ts
Write-Host "Bestand aanmaken: src/index.ts"
@"
import { Document } from './components/document';
import { ParseResult } from './interfaces';

/**
 * Dit is de nieuwe, refactorede functie die de oude vervangt.
 * Het gebruikt de object-georiënteerde builder om de XML te genereren.
 */
export function generateTIAPortalXML(parseResult: ParseResult): string {
  if (!parseResult || !parseResult.steps || parseResult.steps.length === 0) {
    return '<!-- Geen stappen gevonden om te compileren. -->';
  }

  // 1. Maak het hoofddocument aan. De UidManager wordt intern gestart.
  const doc = new Document();

  // 2. Voeg het Function Block (FB) toe.
  const fb = doc.addFb(parseResult.functionBlock || 'FB1');

  // 3. Itereer over de stappen en bouw de netwerken.
  parseResult.steps.forEach((step, idx, arr) => {
    const stepNumber = step.number;
    // Gebruik altijd een geldige resetStep, standaard naar 0 als je buiten bereik bent
    const resetStep = arr[idx + 1]?.number ?? 0;
    
    const title = step.type === 'RUST'
      ? `RUST: `$step.description` || 'Rust stap'`
      : `STAP `$stepNumber`: `$step.description` || 'Beschrijving'`;

    // Voeg een nieuw netwerk toe aan de FB.
    const network = fb.addNetwork(title);

    // 4. Voeg componenten (Parts) toe aan het netwerk.
    // De UIDs worden automatisch en uniek toegewezen door de bibliotheek.
    const setAccess = network.addAccess('Stap', stepNumber);
    const resetAccess = network.addAccess('Stap', resetStep);
    const srBlock = network.addPart('SR');

    // 5. Leg de verbindingen (Wires).
    // De 'operand' van een Access blok is de output, dus geen poortnaam nodig.
    network.connect(setAccess, undefined, srBlock, 'S');
    network.connect(resetAccess, undefined, srBlock, 'R');
  });

  // 6. Genereer de finale, complete XML string.
  return doc.toXml(true);
}
"@ | Set-Content -Encoding UTF8 -Path "src/index.ts"

Write-Host "Projectstructuur en alle component-bestanden zijn succesvol aangemaakt!"
