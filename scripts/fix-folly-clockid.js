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

    if (content.includes('__IPHONE_10_0')) {
      // Replace __IPHONE_10_0 with __IPHONE_16_0 to skip the typedef on iOS 16+
      content = content.replace(/__IPHONE_10_0/g, '__IPHONE_16_0');
      fs.writeFileSync(fullPath, content);
      console.log(`Patched ${relativePath} - replaced __IPHONE_10_0 with __IPHONE_16_0`);
      patched = true;
    } else if (content.includes('__IPHONE_16_0')) {
      console.log(`${relativePath} already patched`);
    } else {
      console.log(`${relativePath} doesn't contain expected pattern`);
    }
  }
}

if (patched) {
  console.log('Successfully patched RCT-Folly Time.h for Xcode 16+ compatibility');
} else {
  console.log('No files needed patching or Time.h not found (may be normal on Android builds)');
}
