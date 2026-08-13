const fs = require('fs');
const path = require('path');

const applyTheme = (filePath) => {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) return;
  
  let content = fs.readFileSync(fullPath, 'utf8');

  // Remaining harsh blues -> soft sky blues
  content = content.replace(/bg-blue-600/g, 'bg-sky-400');
  content = content.replace(/hover:bg-blue-700/g, 'hover:bg-sky-500');
  content = content.replace(/text-blue-900/g, 'text-sky-900');
  content = content.replace(/bg-blue-900/g, 'bg-sky-900');
  content = content.replace(/shadow-blue-500\/30/g, 'shadow-sky-400/30');

  // Text slates that might have been missed
  content = content.replace(/text-slate-900/g, 'text-slate-700');
  content = content.replace(/text-slate-800/g, 'text-slate-600');

  // Clean up any double/malformed classes from previous runs
  content = content.replace(/bg-transparent\/90/g, 'bg-transparent');
  content = content.replace(/bg-white\/90\/90/g, 'bg-white/90');
  
  // DayPicker remaining blue classes
  content = content.replace(/selected: "bg-sky-400 text-white font-bold rounded-lg hover:bg-sky-500 shadow-md"/g, 'selected: "bg-sky-300 text-slate-800 font-bold rounded-lg hover:bg-sky-400 shadow-sm"');

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
