const text = `RUHE: Test

NICHT HMI01 HAND
Sicherheitsbereich 1 OK

SCHRITT 1: Freigabe?`;

console.log('Original:');
console.log(JSON.stringify(text));

function removeExtraWhitespace(text) {
  return text
    .split('\n')
    .map(line => {
      // Preserve leading whitespace for indentation
      const leadingWhitespace = line.match(/^\s*/)[0];
      const trimmed = line.trim();
      return trimmed ? leadingWhitespace + trimmed : '';
    })
    .join('\n');
}

const result = removeExtraWhitespace(text);
console.log('\nAfter removeExtraWhitespace:');
console.log(JSON.stringify(result));

console.log('\nLines:');
result.split('\n').forEach((line, i) => {
  console.log(`${i+1}: "${line}"`);
});