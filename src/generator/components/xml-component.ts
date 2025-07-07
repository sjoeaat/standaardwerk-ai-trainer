
// -------------------
// filename: src/generator/components/xml-component.ts
// -------------------
import { UidManager } from '../uid-manager';
import { IXmlComponent } from '../interfaces';

export abstract class XmlComponent implements IXmlComponent {
  constructor(protected uidManager: UidManager) {}
  abstract toXml(pretty: boolean, level: number): string;
}
