// scripts/copy-pdf-worker.js
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..'); // Resolves to project root from scripts/
const sourcePath = path.join(projectRoot, 'node_modules/pdfjs-dist/build/pdf.worker.js');
const destDir = path.join(projectRoot, 'public');
const destPath = path.join(destDir, 'pdf.worker.js');

try {
  // Ensure public directory exists
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
    console.log(`[Budget Buddy Postinstall] Created directory: ${destDir}`);
  }

  // Check if source file exists before attempting to copy
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    console.log(`[Budget Buddy Postinstall] Successfully copied pdf.worker.js to ${destPath}`);
  } else {
    console.warn(`[Budget Buddy Postinstall] WARNING: pdf.worker.js not found at ${sourcePath}.`);
    console.warn('[Budget Buddy Postinstall] This can happen if pdfjs-dist is not yet fully installed by your package manager.');
    console.warn('[Budget Buddy Postinstall] If PDF import functionality does not work after installation, please try running:');
    console.warn('[Budget Buddy Postinstall] > npm run copy-pdf-worker');
    console.warn('[Budget Buddy Postinstall] (or the equivalent command for yarn/pnpm).');
    // IMPORTANT: Do not exit with an error code here, to allow the main install to proceed.
  }
} catch (error) {
  console.error(`[Budget Buddy Postinstall] ERROR: Failed to copy pdf.worker.js: ${error.message}`);
  // To avoid blocking installation, we're not exiting with 1, but logging a clear error.
  // If this error occurs, manual copying or debugging of permissions might be needed.
}
