# Manual Testing Results - Word Document Parsing

## Test Setup
Using the extracted content from `Programmbeschreibung voorbeeld.docx` to test parsing functionality.

## Test Input Sample
```
Hauptprogramm Einfuhr FB100
Symbolik IDB: Haupt_Einfuhr

RUHE: Hauptprogramm Einfuhr
- Freigabe Start Einfuhr
- DT Start Einfuhr

SCHRITT 1: Selektiere 1e zu füllen Horde
- Horde vorselektiert (Selektionsprogramm Horde für Einfuhr SCHRITT 2+5+8+11)

SCHRITT 2: Warten bis Horde und Einfuhrwagen bereit für Füllen
- Füllen 1e Horde aktiv:
  - Füllen Horde aktiv (Füllen Horde N21 SCHRITT 7)
  - + Füllen Horde aktiv (Füllen Horde N22 SCHRITT 7)
  - + Füllen Horde aktiv (Füllen Horde N23 SCHRITT 7)
  - + Füllen Horde aktiv (Füllen Horde N24 SCHRITT 7)

SCHRITT 3: Produktion
- DT Ende Einfuhr
- +Ende Produktion (K5 in Ruhe) (Komm. von K5)

SCHRITT 4: Start leerdrehen Einfuhrinne N10/N11
- Strömung Einfuhrrinne N10/N11: Strömung Einfuhrrinne N10/N11 OK
- NICHT Staumeldung Einfuhrrinne N10
- NICHT Staumeldung Einfuhrrinne N11
- Zeit 10sek ??

SCHRITT 8: Fertig
- Freigabe Start Einfuhr = RUHE
```

## Expected Results
Based on the RUST/SCHRITT methodology:

### Steps Expected:
1. **RUHE** (step 0): Entry conditions from previous steps
2. **SCHRITT 1**: Entry conditions should be the conditions listed above SCHRITT 1
3. **SCHRITT 2**: Entry conditions should be the conditions listed above SCHRITT 2
4. **SCHRITT 3**: Entry conditions should be the conditions listed above SCHRITT 3
5. **SCHRITT 4**: Entry conditions should be the conditions listed above SCHRITT 4
6. **SCHRITT 8**: Entry conditions should be the conditions listed above SCHRITT 8

### Cross-References Expected:
1. `Horde vorselektiert (Selektionsprogramm Horde für Einfuhr SCHRITT 2+5+8+11)`
   - Program: "Selektionsprogramm Horde für Einfuhr"
   - Steps: [2, 5, 8, 11]

2. `Füllen Horde aktiv (Füllen Horde N21 SCHRITT 7)`
   - Program: "Füllen Horde N21"
   - Steps: [7]

### Timers Expected:
1. `Zeit 10sek ??` should be recognized as timer condition

### Variable Assignments Expected:
1. `Freigabe Start Einfuhr = RUHE` should be recognized as variable assignment

## Test Instructions
1. Open the app at http://localhost:5173/
2. Go to "Code Editor" tab
3. Paste the test input sample
4. Check browser console for debug output
5. Go to "Analyse" tab to see parsed results
6. Compare with expected results above

## Browser Console Debug Commands
```javascript
// Check step pattern matching
const stepPattern = /^(RUST|RUHE|IDLE|STAP|SCHRITT|STEP)(?:\s+(\d+))?:\s*(.*)$/i;
"RUHE: Hauptprogramm Einfuhr".match(stepPattern);
"SCHRITT 1: Selektiere 1e zu füllen Horde".match(stepPattern);

// Check cross-reference pattern
const crossRefPattern = /^(.+?)\s*\(([^)]+)\s+(SCHRITT|STAP|STEP)\s+([0-9+]+)\)\s*$/i;
"Horde vorselektiert (Selektionsprogramm Horde für Einfuhr SCHRITT 2+5+8+11)".match(crossRefPattern);

// Check timer pattern
const timerPattern = /(?:TIJD|ZEIT|TIME)\s+(\d+)\s*(Sek|sek|Min|min|s|m)\s*\??\??/i;
"Zeit 10sek ??".match(timerPattern);
```

## Issues to Look For
1. **Step Recognition**: Are all RUHE and SCHRITT steps being detected?
2. **Condition Parsing**: Are conditions with `-` and `+` prefixes being parsed correctly?
3. **Indentation Handling**: Are indented conditions being recognized?
4. **Cross-References**: Are the program names and step numbers being extracted correctly?
5. **Timer Conditions**: Is "Zeit 10sek ??" being recognized as a timer?
6. **Variable Assignments**: Is "= RUHE" being recognized as an assignment?

## Next Steps Based on Results
- If steps are not recognized: Improve step pattern matching
- If conditions are missing: Enhance condition detection logic
- If cross-references fail: Fix cross-reference regex pattern
- If timers not detected: Improve timer pattern matching
- If assignments missed: Enhance variable assignment detection