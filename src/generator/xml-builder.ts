
// -------------------
// filename: src/generator/xml-builder.ts
// -------------------
export class XmlElement {
  private children: { content: XmlElement | string; isRaw: boolean }[] = [];
  private attributes: { [key: string]: string | number | boolean } = {};

  constructor(public name: string, ...children: (XmlElement | string)[]) {
    this.children = children.map(c => ({ content: c, isRaw: false }));
  }

  public add(child: XmlElement | string) {
    this.children.push({ content: child, isRaw: false });
    return this;
  }
  
  public addRaw(xml: string) {
    this.children.push({ content: xml, isRaw: true });
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

    const isSimpleText = this.children.length === 1 && typeof this.children[0].content === 'string' && !this.children[0].isRaw;
    if (isSimpleText && pretty) {
      const textContent = this.escapeXml(this.children[0].content as string);
      return `${openTag}>${textContent}</${this.name}>`;
    }

    const childrenXml = this.children
      .map(child => {
        if (typeof child.content === 'string') {
            if (child.isRaw) {
                return child.content;
            }
            return (pretty ? indent + '  ' : '') + this.escapeXml(child.content);
        } else {
            return child.content.toString(pretty, level + 1);
        }
      })
      .join(pretty ? '\n' : '');

    return `${openTag}>${pretty ? '\n' : ''}${childrenXml}${pretty ? '\n' + indent : ''}</${this.name}>`;
  }
}
