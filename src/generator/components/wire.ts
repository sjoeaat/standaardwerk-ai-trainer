
// -------------------
// filename: src/generator/components/wire.ts
// -------------------
import { UidManager } from '../uid-manager';
import { XmlElement } from '../xml-builder';
import { XmlComponent } from './xml-component';

export class Wire extends XmlComponent {
  public readonly id: number;

  constructor(
    uidManager: UidManager,
    private from: { partId: number; port?: string },
    public readonly to: { partId: number; port: string }
  ) {
    super(uidManager);
    this.id = this.uidManager.next();
  }

  toXml(pretty: boolean = true, level: number = 0): string {
    const wire = new XmlElement('Wire').attr('UId', this.id);
    if (this.from.port) {
        wire.add(new XmlElement('NameCon').attr('UId', this.from.partId).attr('Name', this.from.port));
    } else {
        wire.add(new XmlElement('IdentCon').attr('UId', this.from.partId));
    }
    wire.add(new XmlElement('NameCon').attr('UId', this.to.partId).attr('Name', this.to.port));
    return wire.toString(pretty, level);
  }
}
