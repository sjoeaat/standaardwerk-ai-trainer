
// -------------------
// filename: src/generator/components/network.ts
// -------------------
import { UidManager } from '../uid-manager';
import { XmlElement } from '../xml-builder';
import { MultilingualText } from './multilingual-text';
import { Access, Part } from './part';
import { Wire } from './wire';
import { XmlComponent } from './xml-component';

export class Network extends XmlComponent {
  private id: number;
  private parts: (Part | Access)[] = [];
  private wires: Wire[] = [];
  private title: MultilingualText;
  private comment: MultilingualText;
  
  private static readonly partDefinitions = {
      "Sr": { inputs: ["s", "r1", "operand"], outputs: ["q"] },
      "Coil": { inputs: ["in", "operand"], outputs: [] },
      "A": { 
        inputs: Array.from({length: 30}, (_, i) => `in${i + 1}`), 
        outputs: ["out"] 
      },
  };

  constructor(parentUidManager: UidManager, title: string, baseUid: number) {
    super(new UidManager(baseUid));
    this.id = parentUidManager.next();
    this.title = new MultilingualText(this.uidManager, 'Title', title);
    this.comment = new MultilingualText(this.uidManager, 'Comment');
  }

  addPart(name: keyof typeof Network.partDefinitions): Part {
    const definition = Network.partDefinitions[name];
    if (!definition) {
      throw new Error(`Part definition for '${name}' not found.`);
    }
    const part = new Part(this.uidManager, name, definition);
    this.parts.push(part);
    return part;
  }

  addAccess(variable: string, index: number): Access {
      const access = new Access(this.uidManager, variable, index);
      this.parts.push(access);
      return access;
  }

  addLiteralBool(value: boolean): Access {
      const access = new Access(this.uidManager, '', null, true, value);
      this.parts.push(access);
      return access;
  }

  connect(from: Part | Access, fromPort: string | undefined, to: Part, toPort: string, options?: { negated?: boolean }) {
    const wire = new Wire(this.uidManager, { partId: from.id, port: fromPort }, { partId: to.id, port: toPort });
    this.wires.push(wire);

    if (options?.negated) {
      to.negateInput(toPort);
    }
    
    return this;
  }

  toXml(pretty: boolean = true, level: number = 0): string {
    const partInputCounts = new Map<number, number>();
    this.wires.forEach(wire => {
        const targetPartId = wire.to.partId;
        partInputCounts.set(targetPartId, (partInputCounts.get(targetPartId) || 0) + 1);
    });

    this.parts.forEach(part => {
        if (part instanceof Part && (part.name === 'A')) {
            part.cardinality = partInputCounts.get(part.id) || 0;
        }
    });

    const partsContainer = new XmlElement('Parts');
    this.parts.forEach(p => partsContainer.addRaw(p.toXml(pretty, level + 5)));
    
    const wiresContainer = new XmlElement('Wires');
    this.wires.forEach(w => wiresContainer.addRaw(w.toXml(pretty, level + 5)));

    const flgNet = new XmlElement('FlgNet')
      .attr('xmlns', 'http://www.siemens.com/automation/Openness/SW/NetworkSource/FlgNet/v4')
      .add(partsContainer)
      .add(wiresContainer);

    const networkSource = new XmlElement('NetworkSource').add(flgNet);
    
    const attributeList = new XmlElement('AttributeList')
        .add(networkSource)
        .add(new XmlElement('ProgrammingLanguage', 'FBD'));

    const objectList = new XmlElement('ObjectList')
        .addRaw(this.comment.toXml(pretty, level + 3))
        .addRaw(this.title.toXml(pretty, level + 3));

    return new XmlElement('SW.Blocks.CompileUnit')
      .attr('ID', this.id)
      .attr('CompositionName', 'CompileUnits')
      .add(attributeList)
      .add(objectList)
      .toString(pretty, level);
  }
}
