// Standaard invoer en syntax-regels

export const defaultInput = `L01: Hoofdprogramma Kraan FB300

Symbool IDB: L01_Hoofdprogramma_kraan

RUST: L01: Hoofdprogramma kraan
Kraan beweging gewenst
Geen kraan route actief of gestart

STAP 1: Kraan naar losstation?
Ja, kooi is bijna leeg
Aantal_Kazen <= 10

STAP 2: Start kraan zonder kooi naar losstation
Motor_Status == 2
Tijd ~5Sek

STAP 3: Klaar
Vrijgave_Transport =
Machine niet actief
NIET Noodstop_ingedrukt`;

export const defaultSyntaxRules = {
  stepKeywords: {
    rest: ['RUST', 'RUHE', 'IDLE'],
    step: ['STAP', 'SCHRITT', 'STEP'],
    end: ['KLAAR', 'FERTIG', 'END']
  },
  variableDetection: {
    timerKeywords: ['tijd', 'zeit', 'time', 'timer', 'dt', 'delay'],
    markerKeywords: ['status', 'actief', 'vrijgave', 'enable', 'start', 'stop', 'ready'],
    storingKeywords: ['storing', 'fault', 'error', 'alarm']
  },
  conditions: {
    orPrefix: '+',
    notPrefix: ['NIET', 'NICHT', 'NOT'],
    transitionPrefix: '->'
  },
  format: {
    requireColon: true,
    allowSpaces: true
  }
};
