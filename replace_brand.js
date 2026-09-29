const fs = require('fs');
const path = require('path');

const IGNORED_DIRS = new Set([
  'node_modules', '.git', '.next', 'test-results', 
  'build', '.dart_tool', 'ephemeral', 
  '.freebuff', 'coverage'
]);
const IGNORED_EXTS = new Set([
  '.png', '.jpg', '.jpeg', '.pdf', '.svg', '.ico', 
  '.apk', '.lock', '.sha1', '.tsbuildinfo', '.jar', '.keystore'
]);

// specifically ignore these files that shouldn't have their app name/ids changed
const IGNORED_FILES = new Set([
  'pnpm-lock.yaml', 'package-lock.json', 'yarn.lock'
]);

function walkDir(dir, callback) {
  if (IGNORED_DIRS.has(path.basename(dir))) return;
  
  let files;
  try {
    files = fs.readdirSync(dir);
  } catch (e) {
    return;
  }
  
  for (const f of files) {
    const dirPath = path.join(dir, f);
    let isDirectory = false;
    try {
      isDirectory = fs.statSync(dirPath).isDirectory();
    } catch(e) {
      continue;
    }
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      const ext = path.extname(f);
      if (!IGNORED_EXTS.has(ext) && !IGNORED_FILES.has(f)) {
        callback(dirPath);
      }
    }
  }
}

let changedFiles = 0;
walkDir(process.cwd(), (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file seems to be binary
    if (content.indexOf('\0') !== -1) return;
    
    let newContent = content;
    
    // Safe replacements
    newContent = newContent.replace(/OwnerPing/g, 'OwnerPing');
    newContent = newContent.replace(/OwnerPing/g, 'OwnerPing');
    // Ensure we don't ruin things like PINGMYCAR_API_BASE_URL
    newContent = newContent.replace(/OWNERPING(?![_A-Z])/g, 'OWNERPING');
    newContent = newContent.replace(/Connect Vehicle Owners/gi, 'Connect Vehicle Owners');
    newContent = newContent.replace(/Connect Vehicle Owners/gi, 'Connect Vehicle Owners');

    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      changedFiles++;
      console.log(`Updated ${filePath}`);
    }
  } catch(e) {
    // Ignore read errors
  }
});
console.log(`Changed ${changedFiles} files`);
