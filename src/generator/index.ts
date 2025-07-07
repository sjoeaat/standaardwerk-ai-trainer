// =================================================================
// src/generator/index.ts (Definitieve, Gecorrigeerde Versie)
// =================================================================
// Deze versie lost de "Duplicate ID" en "Operand not connected"
// fouten op door de UID-logica en de netwerkverbindingen
// te corrigeren.
// =================================================================

import { Document } from './components/document';
import { ParseResult, Step } from './interfaces';
import { Access } from './components/part';

export function generateTIAPortalXML(parseResult: ParseResult): string {
  if (!parseResult || !parseResult.steps || parseResult.steps.length === 0) {
    return '<!-- Geen stappen gevonden om te compileren. -->';
  }

  const doc = new Document();
  const fb = doc.addFb(parseResult.functionBlock || 'FB1');

  // Dynamisch de interface opbouwen met de juiste commentaren
  const stapMember = fb.interface.sections.Static.addMember('Stap', 'Array[0..31] of Bool', 'Retain');
  parseResult.steps.forEach(step => {
      const commentText = `${step.type === 'RUST' ? 'RUST' : `STAP ${step.number}`}: ${step.description || ''}`.trim();
      stapMember.addSubelement(String(step.number), commentText);
  });
  // Voeg de overige standaard statische variabelen toe
  fb.interface.sections.Static.addMember('Stap_A', 'Array[0..31] of Bool', 'Retain');
  fb.interface.sections.Static.addMember('Stap_B', 'Array[0..31] of Bool', 'Retain');
  fb.interface.sections.Static.addMember('Stap_C', 'Array[0..31] of Bool', 'Retain');
  fb.interface.sections.Static.addMember('Hulp', 'Array[1..32] of Bool', 'Retain');
  fb.interface.sections.Static.addMember('Tijd', 'Array[1..10] of IEC_TIMER', 'Retain');
  fb.interface.sections.Static.addMember('Teller', 'Array[1..10] of Int', 'Retain');
  fb.interface.sections.Output.addMember('Uit_Stap_Tekst', 'Int');

  // Netwerk 1: RUST Logic (Stap 0)
  const rustStep = parseResult.steps.find(s => s.type === 'RUST');
  if (rustStep) {
    // CORRECTIE: Gebruik een hoge, veilige base UID om conflicten te voorkomen.
    const rustNetwork = fb.addNetwork(rustStep.description || 'RUST Logic', 500); 
    const stepsToReset = parseResult.steps.filter(s => s.type === 'STAP');
    const stepAccesses = stepsToReset.map(step => 
        rustNetwork.addAccess('Stap', step.number)
    );
    
    const aGateRust = rustNetwork.addPart('A');
    stepAccesses.forEach((access, idx) => {
      rustNetwork.connect(access, undefined, aGateRust, `in${idx + 1}`, { negated: true });
    });

    const srRust = rustNetwork.addPart('Sr');
    const firstStep = parseResult.steps.find(s => s.type === 'STAP');
    if(firstStep) {
        const step1Access = rustNetwork.addAccess('Stap', firstStep.number);
        rustNetwork.connect(step1Access, undefined, srRust, 'r1');
    }
    
    rustNetwork.connect(aGateRust, 'out', srRust, 's');
    
    // CORRECTIE: Voeg de cruciale operand-verbinding toe.
    const srRustOperand = rustNetwork.addAccess('Stap', 0);
    rustNetwork.connect(srRustOperand, undefined, srRust, 'operand');
  }

  // Process alle stappen (STAP 1 tot N)
  const normalSteps = parseResult.steps.filter(s => s.type === 'STAP');
  normalSteps.forEach((step, idx) => {
    const isFinalStep = idx === normalSteps.length - 1;
    
    const title = `STAP ${step.number}: ${step.description || ''}`;
    // CORRECTIE: Gebruik een hoge, veilige base UID om conflicten te voorkomen.
    const baseUid = 1000 + idx * 100;
    const network = fb.addNetwork(title, baseUid);

    // Voorwaarde 1: Vorige stap is waar
    const prevStepNumber = idx === 0 ? 0 : normalSteps[idx - 1].number;
    const prevStepAccess = network.addAccess('Stap', prevStepNumber);
    
    // Voorwaarde 2: Huidige stap is NIET waar
    const notCurrentStepAccess = network.addAccess('Stap', step.number);

    // Voorwaarde 3: Extra conditie (standaard 'false')
    const falseAccess = network.addLiteralBool(false);
    
    const conditionGate = network.addPart('A');
    network.connect(prevStepAccess, undefined, conditionGate, 'in1');
    network.connect(notCurrentStepAccess, undefined, conditionGate, 'in2', { negated: true });
    network.connect(falseAccess, undefined, conditionGate, 'in3');
    
    if (isFinalStep) {
        const coil = network.addPart('Coil');
        const coilOperand = network.addAccess('Stap', step.number);
        network.connect(conditionGate, 'out', coil, 'in');
        network.connect(coilOperand, undefined, coil, 'operand');
    } else {
        const nextStep = normalSteps[idx + 1];
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
