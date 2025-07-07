
// -------------------
// filename: src/generator/index.ts
// -------------------
import { Document } from './generator/components/document';
import { ParseResult, Step } from './generator/interfaces';
import { Access } from './generator/components/part';

export function generateTIAPortalXML(parseResult: ParseResult): string {
  if (!parseResult || !parseResult.steps || parseResult.steps.length === 0) {
    return '<!-- Geen stappen gevonden om te compileren. -->';
  }

  const doc = new Document();
  const fb = doc.addFb(parseResult.functionBlock || 'FB1');

  // CORRECTIE: Dynamisch de interface opbouwen met commentaar
  const stapMember = fb.interface.sections.Static.addMember('Stap', 'Array[0..31] of Bool', 'Retain');
  parseResult.steps.forEach(step => {
      stapMember.addSubelement(String(step.number), step.description || `Stap ${step.number}`);
  });

  // Netwerk 1: RUST Logic (Stap 0)
  const rustNetwork = fb.addNetwork(parseResult.steps[0]?.description || 'RUST Logic', 21);
  const stepsToReset = parseResult.steps.filter(s => s.number > 0);
  const stepAccesses: Access[] = stepsToReset.map(step => 
      rustNetwork.addAccess('Stap', step.number)
  );
  
  const aGateRust = rustNetwork.addPart('A');
  stepAccesses.forEach((access, idx) => {
    rustNetwork.connect(access, undefined, aGateRust, `in${idx + 1}`, { negated: true });
  });

  const srRust = rustNetwork.addPart('Sr');
  const srRustOperand = rustNetwork.addAccess('Stap', 0);
  const step1Access = rustNetwork.addAccess('Stap', 1);
  
  rustNetwork.connect(aGateRust, 'out', srRust, 's');
  rustNetwork.connect(step1Access, undefined, srRust, 'r1');
  rustNetwork.connect(srRustOperand, undefined, srRust, 'operand');

  // Process alle normale stappen (vanaf de tweede stap in de lijst)
  parseResult.steps.slice(1).forEach((step: Step, idx: number) => {
    const allSteps = parseResult.steps;
    const currentStepIndex = idx + 1;
    const isFinalStep = currentStepIndex === allSteps.length - 1;

    const prevStep = allSteps[currentStepIndex - 1];
    const prevPrevStep = currentStepIndex > 1 ? allSteps[currentStepIndex - 2] : null;

    const title = `${step.type}: ${step.description || ''}`;
    const baseUid = 100 + currentStepIndex * 100;
    const network = fb.addNetwork(title, baseUid);

    const prevStepAccess = network.addAccess('Stap', prevStep.number);
    const falseAccess = network.addLiteralBool(false);
    
    const conditionGate = network.addPart('A');
    network.connect(prevStepAccess, undefined, conditionGate, 'in1');
    
    if (prevPrevStep) {
        const prevPrevStepAccess = network.addAccess('Stap', prevPrevStep.number);
        network.connect(prevPrevStepAccess, undefined, conditionGate, 'in2', { negated: true });
    }
    
    // Standaard 'false' voorwaarde toevoegen
    network.connect(falseAccess, undefined, conditionGate, 'in3');
    
    if (isFinalStep) {
        const coil = network.addPart('Coil');
        const coilOperand = network.addAccess('Stap', step.number);
        network.connect(conditionGate, 'out', coil, 'in');
        network.connect(coilOperand, undefined, coil, 'operand');
    } else {
        const nextStep = allSteps[currentStepIndex + 1];
        const srBlock = network.addPart('Sr');
        const resetStepAccess = network.addAccess('Stap', nextStep.number);
        const srOperand = network.addAccess('Stap', step.number);

        network.connect(conditionGate, 'out', srBlock, 's');
        network.connect(resetStepAccess, undefined, srBlock, 'r1');
        network.connect(srOperand, undefined, srBlock, 'operand');
    }
  });

  return doc.toXml(true);
}