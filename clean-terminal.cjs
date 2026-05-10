const fs = require('fs');
const path = require('path');

function cleanFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace slate with zinc (neutral gray instead of bluish gray)
  content = content.replace(/slate-/g, 'zinc-');
  
  // Replace cyan-500 with white (for text/border) or black (for bg) depending on context
  // Actually, let's just use white for accents in a dark theme, or black if it's a light theme.
  // The terminal is dark: bg-zinc-950.
  // So bg-cyan-500 -> bg-white text-black
  content = content.replace(/bg-cyan-500 text-slate-950/g, 'bg-white text-black');
  content = content.replace(/bg-cyan-500 text-zinc-950/g, 'bg-white text-black');
  content = content.replace(/bg-cyan-500/g, 'bg-white text-black');
  content = content.replace(/text-cyan-500/g, 'text-white');
  content = content.replace(/border-cyan-500/g, 'border-white');
  content = content.replace(/shadow-\[0_0_20px_rgba\(6,182,212,0\.5\)\]/g, 'shadow-none');
  
  // Also remove blue from TerminalLogin
  content = content.replace(/bg-blue-950\/20/g, 'bg-zinc-900/50');
  content = content.replace(/border-blue-500\/20/g, 'border-zinc-800');
  content = content.replace(/text-blue-300/g, 'text-zinc-300');
  content = content.replace(/text-blue-400/g, 'text-zinc-400');
  
  fs.writeFileSync(filePath, content);
  console.log('Cleaned ' + filePath);
}

cleanFile(path.join(__dirname, 'components/Terminal.tsx'));
cleanFile(path.join(__dirname, 'components/TerminalLogin.tsx'));
