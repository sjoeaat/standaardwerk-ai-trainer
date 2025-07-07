
// -------------------
// filename: src/generator/components/document.ts
// -------------------
import { UidManager } from '../uid-manager';
import { XmlElement } from '../xml-builder';
import { FunctionBlock } from './fb';
import { XmlComponent } from './xml-component';

export class Document extends XmlComponent {
  private fb: FunctionBlock | null = null;

  constructor() {
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
        doc.addRaw(this.fb.toXml(pretty, level + 1));
    }
    
    const declaration = '<?xml version="1.0" encoding="utf-8"?>\n';
    return declaration + doc.toString(pretty, level);
  }
}
