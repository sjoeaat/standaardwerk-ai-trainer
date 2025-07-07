
// -------------------
// filename: src/generator/components/fb.ts
// -------------------
import { UidManager } from '../uid-manager';
import { XmlElement } from '../xml-builder';
import { MultilingualText } from './multilingual-text';
import { Network } from './network';
import { XmlComponent } from './xml-component';
import { Interface } from './interface';

export class FunctionBlock extends XmlComponent {
  private id: number;
  private networks: Network[] = [];
  private name: string;
  private number: number;
  private comment: MultilingualText;
  private title: MultilingualText;
  public interface: Interface;

  constructor(uidManager: UidManager, name: string) {
    super(uidManager);
    this.id = this.uidManager.next();
    this.name = name;
    this.number = parseInt(name.replace(/[^0-9]/g, '')) || 1;
    this.comment = new MultilingualText(this.uidManager, 'Comment');
    this.title = new MultilingualText(this.uidManager, 'Title');
    this.interface = new Interface(this.uidManager);
  }

  addNetwork(title: string, baseUid: number): Network {
    const network = new Network(this.uidManager, title, baseUid);
    this.networks.push(network);
    return network;
  }

  toXml(pretty: boolean = true, level: number = 0): string {
    const attrList = new XmlElement('AttributeList')
        .add(new XmlElement('AutoNumber', 'false'))
        .addRaw(this.interface.toXml(pretty, level + 2))
        .add(new XmlElement('IsRetainMemResEnabled', 'true'))
        .add(new XmlElement('MemoryLayout', 'Optimized'))
        .add(new XmlElement('MemoryReserve', '4000'))
        .add(new XmlElement('Name', this.name))
        .add(new XmlElement('Namespace'))
        .add(new XmlElement('Number', String(this.number)))
        .add(new XmlElement('ProgrammingLanguage', 'FBD'))
        .add(new XmlElement('RetainMemoryReserve', '4000'))
        .add(new XmlElement('SetENOAutomatically', 'true'));

    const objectList = new XmlElement('ObjectList')
        .addRaw(this.comment.toXml(pretty, level + 3));
    
    this.networks.forEach(n => objectList.addRaw(n.toXml(pretty, level + 3)));
    
    objectList.addRaw(this.title.toXml(pretty, level + 3));

    return new XmlElement('SW.Blocks.FB')
      .attr('ID', this.id)
      .add(attrList)
      .add(objectList)
      .toString(pretty, level);
  }
}
