const fs = require('fs');
const path = require('path');

function fixTypo(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/tranzinc-/g, 'translate-');
  fs.writeFileSync(filePath, content);
  console.log('Fixed ' + filePath);
}

fixTypo(path.join(__dirname, 'components/Terminal.tsx'));
fixTypo(path.join(__dirname, 'components/TerminalLogin.tsx'));
