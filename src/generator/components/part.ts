
// -------------------
// filename: src/generator/components/part.ts
// -------------------
import { UidManager } from '../uid-manager';
import { XmlElement } from '../xml-builder';
import { XmlComponent } from './xml-component';

export class Part extends XmlComponent {
  public readonly id: number;
  public readonly name: string;
  public readonly inputs: string[];
  public readonly outputs: string[];
  public cardinality: number | null = null;
  public negatedInputs = new Set<string>();

  constructor(uidManager: UidManager, name: string, definition: { inputs: string[], outputs: string[] }) {
    super(uidManager);
    this.id = this.uidManager.next();
    this.name = name;
    this.inputs = definition.inputs;
    this.outputs = definition.outputs;
  }

  public negateInput(portName: string) {
    if (this.inputs.includes(portName)) {
      this.negatedInputs.add(portName);
    } else {
      console.warn(`Poort ${portName} niet gevonden op onderdeel ${this.name} en kan niet worden genegeerd.`);
    }
  }

  toXml(pretty: boolean = true, level: number = 0): string {
    const partElement = new XmlElement('Part')
      .attr('Name', this.name)
      .attr('UId', this.id);

    if (this.cardinality !== null && this.cardinality > 0) {
      const templateValue = new XmlElement('TemplateValue')
        .attr('Name', 'Card')
        .attr('Type', 'Cardinality')
        .add(String(this.cardinality));
      partElement.add(templateValue);
    }

    this.negatedInputs.forEach(portName => {
        partElement.add(new XmlElement('Negated').attr('Name', portName));
    });
    
    return partElement.toString(pretty, level);
  }
}

export class Access extends XmlComponent {
    public readonly id: number;

    constructor(uidManager: UidManager, private variable: string, private index: number | null, private isLiteralBool: boolean = false, private literalValue: boolean = false) {
        super(uidManager);
        this.id = this.uidManager.next();
    }

    toXml(pretty: boolean = true, level: number = 0): string {
        if (this.isLiteralBool) {
            const constant = new XmlElement('Constant')
                .add(new XmlElement('ConstantType', 'Bool'))
                .add(new XmlElement('ConstantValue', String(this.literalValue)));
            return new XmlElement('Access')
                .attr('Scope', 'LiteralConstant')
                .attr('UId', this.id)
                .add(constant)
                .toString(pretty, level);
        }

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
