
// -------------------
// filename: src/generator/interfaces.ts
// -------------------
export interface Step {
    number: number;
    type: 'STAP' | 'RUST';
    description?: string;
  }
  
  export interface ParseResult {
    functionBlock?: string;
    steps: Step[];
  }
  
  export interface IXmlComponent {
    toXml(pretty?: boolean, level?: number): string;
  }
  