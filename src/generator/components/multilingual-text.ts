
// -------------------
// filename: src/generator/components/multilingual-text.ts
// -------------------
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
        .add(new XmlElement('Text', text || ''));
        
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
