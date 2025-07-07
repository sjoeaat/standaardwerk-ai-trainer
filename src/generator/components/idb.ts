// src/generator/components/idb.ts
import { UidManager } from '../uid-manager';
import { XmlElement } from '../xml-builder';
import { MultilingualText } from './multilingual-text';
import { XmlComponent } from './xml-component';

/**
 * Instance Data Block (IDB) generator voor TIA Portal
 */
export class InstanceDB extends XmlComponent {
  private id: number;
  private name: string;
  private number: number;
  private instanceOfName: string;
  private instanceOfType: 'FB' | 'FC';
  private comment: MultilingualText;
  private title: MultilingualText;

  constructor(
    uidManager: UidManager, 
    name: string, 
    number: number, 
    instanceOfName: string,
    instanceOfType: 'FB' | 'FC' = 'FB'
  ) {
    super(uidManager);
    this.id = this.uidManager.next();
    this.name = name;
    this.number = number;
    this.instanceOfName = instanceOfName;
    this.instanceOfType = instanceOfType;
    this.comment = new MultilingualText(this.uidManager, 'Comment');
    this.title = new MultilingualText(this.uidManager, 'Title');
  }

  toXml(pretty: boolean = true, level: number = 0): string {
    // Interface sectie voor IDB
    const interfaceXml = `<Interface><Sections xmlns="http://www.siemens.com/automation/Openness/SW/Interface/v5">
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
</Sections></Interface>`;

    const attrList = new XmlElement('AttributeList')
        .add(new XmlElement('AutoNumber', 'false'))
        .add(new XmlElement('InstanceOfName', this.instanceOfName))
        .add(new XmlElement('InstanceOfType', this.instanceOfType))
        .addRaw(interfaceXml)
        .add(new XmlElement('Name', this.name))
        .add(new XmlElement('Namespace'))
        .add(new XmlElement('Number', String(this.number)))
        .add(new XmlElement('ProgrammingLanguage', 'DB'));

    const objectList = new XmlElement('ObjectList')
        .addRaw(this.comment.toXml(pretty, level + 3))
        .addRaw(this.title.toXml(pretty, level + 3));

    return new XmlElement('SW.Blocks.InstanceDB')
      .attr('ID', this.id)
      .add(attrList)
      .add(objectList)
      .toString(pretty, level);
  }
}

// Uitbreiding voor Document class om IDB's te ondersteunen
export class DocumentWithIDB extends XmlComponent {
  private fb: any = null;
  private idb: InstanceDB | null = null;

  constructor() {
    super(new UidManager(0));
  }

  addFb(name: string): any {
    // Import de originele FunctionBlock class
    const { FunctionBlock } = require('./fb');
    this.fb = new FunctionBlock(this.uidManager, name);
    return this.fb;
  }

  addIdb(name: string, number: number, instanceOfName: string): InstanceDB {
    this.idb = new InstanceDB(this.uidManager, name, number, instanceOfName);
    return this.idb;
  }

  toXml(pretty: boolean = true, level: number = 0): string {
    const doc = new XmlElement('Document')
        .add(new XmlElement('Engineering').attr('version', 'V18'));

    if (this.fb) {
        doc.addRaw(this.fb.toXml(pretty, level + 1));
    }
    
    if (this.idb) {
        doc.addRaw(this.idb.toXml(pretty, level + 1));
    }
    
    const declaration = '<?xml version="1.0" encoding="utf-8"?>\n';
    return declaration + doc.toString(pretty, level);
  }
}