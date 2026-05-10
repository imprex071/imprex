const fs = require('fs');
const path = require('path');

function makeLight(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Backgrounds
  content = content.replace(/bg-zinc-950/g, 'bg-white');
  content = content.replace(/bg-zinc-900\/50/g, 'bg-gray-50');
  content = content.replace(/bg-zinc-900\/40/g, 'bg-gray-50');
  content = content.replace(/bg-zinc-900/g, 'bg-gray-50');
  content = content.replace(/bg-zinc-800\/50/g, 'bg-gray-100');
  content = content.replace(/bg-black/g, 'bg-gray-50');
  
  // Borders
  content = content.replace(/border-zinc-800/g, 'border-gray-200');
  content = content.replace(/border-zinc-700/g, 'border-gray-300');
  content = content.replace(/border-white\/10/g, 'border-gray-200');
  content = content.replace(/border-white\/20/g, 'border-gray-300');
  
  // Text colors
  content = content.replace(/text-zinc-200/g, 'text-gray-800');
  content = content.replace(/text-zinc-300/g, 'text-gray-700');
  content = content.replace(/text-zinc-400/g, 'text-gray-600');
  content = content.replace(/text-zinc-500/g, 'text-gray-500');
  content = content.replace(/text-zinc-600/g, 'text-gray-400');
  
  // Primary buttons (were bg-white text-black, now bg-gray-900 text-white)
  content = content.replace(/bg-white text-black/g, 'bg-gray-900 text-white');
  
  // Active tabs (were bg-zinc-700 text-white, now bg-gray-900 text-white)
  content = content.replace(/bg-zinc-700 text-white/g, 'bg-gray-900 text-white');
  
  // General white text (headings, icons) -> gray-900
  content = content.replace(/text-white/g, 'text-gray-900');
  
  // Fix the primary buttons and active tabs that were just broken by the previous line
  content = content.replace(/bg-gray-900 text-gray-900/g, 'bg-gray-900 text-white');
  
  // Inputs focus
  content = content.replace(/focus:border-white/g, 'focus:border-gray-900');

  // Hover states
  content = content.replace(/hover:text-white/g, 'hover:text-gray-900');
  content = content.replace(/hover:bg-white\/10/g, 'hover:bg-gray-900/10');
  content = content.replace(/hover:text-zinc-300/g, 'hover:text-gray-700');
  
  fs.writeFileSync(filePath, content);
  console.log('Made light ' + filePath);
}

makeLight(path.join(__dirname, 'components/Terminal.tsx'));
makeLight(path.join(__dirname, 'components/TerminalLogin.tsx'));
