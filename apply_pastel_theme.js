const fs = require('fs');
const path = require('path');

const applyTheme = (filePath) => {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');

  // Background and text replacements
  content = content.replace(/bg-white/g, 'bg-white/90');
  content = content.replace(/text-slate-900/g, 'text-slate-800');
  content = content.replace(/text-slate-800/g, 'text-slate-700');
  
  // Specific hero replacements
  content = content.replace(/bg-blue-900\/30/g, 'bg-sky-200/40'); // Hero overlay
  content = content.replace(/bg-blue-500/g, 'bg-sky-400');
  
  // Header replacements
  content = content.replace(/bg-white\/90\/80/g, 'bg-white/80'); // fix double replace
  content = content.replace(/bg-white\/80 backdrop-blur-md/g, 'glass-panel');
  content = content.replace(/bg-white\/90\/95 backdrop-blur-md/g, 'glass-panel');
  
  // Card replacements
  content = content.replace(/bg-white\/90 rounded-md p-6/g, 'glass-card rounded-2xl p-6');
  content = content.replace(/border-slate-100/g, 'border-white');
  content = content.replace(/shadow-xl/g, 'shadow-lg');
  
  // Primary buttons (like Book Now)
  content = content.replace(/bg-blue-600 hover:bg-blue-700/g, 'bg-sky-400 hover:bg-sky-500 text-slate-50 border-none shadow-md');
  content = content.replace(/text-blue-600/g, 'text-sky-600');
  
  // Input fields
  content = content.replace(/border-slate-300 focus:ring-blue-500 focus:border-blue-500/g, 'border-sky-100 bg-white/70 focus:ring-sky-300 focus:border-sky-300 focus:bg-white');
  
  // Private Tour theme logic update
  content = content.replace(/bg-slate-900/g, 'bg-sky-900');
  content = content.replace(/from-slate-800 to-indigo-900/g, 'from-sky-800 to-sky-600');
  
  // Section background
  content = content.replace(/bg-slate-50/g, 'bg-transparent');
  content = content.replace(/bg-blue-50/g, 'bg-sky-50');

  // Main wrapper bg-white to transparent since global sets it
  content = content.replace(/className="w-full flex-1 overflow-y-auto pb-0 bg-white\/90"/g, 'className="w-full flex-1 overflow-y-auto pb-0 bg-transparent"');
  content = content.replace(/fixed inset-0 flex flex-col bg-white\/90 text-slate-800/g, 'fixed inset-0 flex flex-col bg-transparent text-slate-700');

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Updated ${filePath}`);
};

const components = [
  'src/components/landing/ReservationClientPage.tsx',
  'src/components/landing/FAQSection.tsx',
  'src/components/landing/PickupGuide.tsx',
  'src/components/landing/TourCourseTimeline.tsx',
  'src/components/landing/ImageCarousel.tsx'
];

components.forEach(applyTheme);
