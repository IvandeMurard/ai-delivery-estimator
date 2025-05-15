const fs = require('fs');
const path = require('path');

// Caractères invisibles à détecter (hors espace/tabulation/retour ligne)
const INVISIBLE_CHARS = [
  '\u200B', // zero-width space
  '\u200C', // zero-width non-joiner
  '\u200D', // zero-width joiner
  '\uFEFF', // BOM
  '\u2060', // word joiner
  '\u00A0', // nbsp
];
const INVISIBLE_REGEX = new RegExp(INVISIBLE_CHARS.join('|'), 'g');

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let found = false;
  content.split(/\r?\n/).forEach((line, idx) => {
    if (INVISIBLE_REGEX.test(line)) {
      found = true;
      console.log(`Invisible char in ${filePath}:${idx + 1}`);
    }
  });
  return found;
}

function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.ts') || p.endsWith('.tsx')) {
      scanFile(p);
    }
  });
}

walk(path.resolve(__dirname, '../src'));
console.log('Scan terminé.'); 