#!/usr/bin/env node

/**
 * This script patches RCT-Folly's Time.h to fix the clockid_t typedef
 * redefinition error that occurs with Xcode 16+.
 *
 * Run via eas-build-post-install hook after pod install completes.
 */

const fs = require('fs');
const path = require('path');

const timeHPaths = [
  'ios/Pods/RCT-Folly/folly/portability/Time.h',
  'ios/Pods/Headers/Private/RCT-Folly/folly/portability/Time.h',
  'ios/Pods/Headers/Public/RCT-Folly/folly/portability/Time.h',
];

let patched = false;

for (const relativePath of timeHPaths) {
  const fullPath = path.join(process.cwd(), relativePath);

  if (fs.existsSync(fullPath)) {
    console.log(`Found Time.h at: ${fullPath}`);

    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;

    // Strategy 1: Comment out the typedef uint8_t clockid_t line directly
    if (content.includes('typedef uint8_t clockid_t;')) {
      content = content.replace(
        /typedef uint8_t clockid_t;/g,
        '// typedef uint8_t clockid_t; // PATCHED: commented out to fix Xcode 16+ build'
      );
      modified = true;
      console.log(`Patched ${relativePath} - commented out typedef uint8_t clockid_t`);
    }

    // Strategy 2: Try the __IPHONE_10_0 pattern (older versions)
    if (!modified && content.includes('__IPHONE_10_0')) {
      content = content.replace(/__IPHONE_10_0/g, '__IPHONE_16_0');
      modified = true;
      console.log(`Patched ${relativePath} - replaced __IPHONE_10_0 with __IPHONE_16_0`);
    }

    // Strategy 3: Try __IPHONE_12_0 pattern
    if (!modified && content.includes('__IPHONE_12_0') && !content.includes('__IPHONE_16_0')) {
      content = content.replace(/__IPHONE_12_0/g, '__IPHONE_16_0');
      modified = true;
      console.log(`Patched ${relativePath} - replaced __IPHONE_12_0 with __IPHONE_16_0`);
    }

    if (modified) {
      fs.writeFileSync(fullPath, content);
      patched = true;
    } else if (content.includes('// PATCHED') || content.includes('__IPHONE_16_0')) {
      console.log(`${relativePath} already patched`);
    } else {
      // Print first 500 chars to debug what's in the file
      console.log(`${relativePath} doesn't contain expected patterns`);
      console.log(`File preview (first 500 chars):`);
      console.log(content.substring(0, 500));
    }
  }
}

if (patched) {
  console.log('Successfully patched RCT-Folly Time.h for Xcode 16+ compatibility');
} else {
  console.log('No files needed patching or Time.h not found (may be normal on Android builds)');
}