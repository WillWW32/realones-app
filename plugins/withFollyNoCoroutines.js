const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin to fix Folly/Xcode 16+ compatibility issues:
 * 1. 'folly/coro/Coroutine.h' file not found error
 * 2. typedef redefinition error for clockid_t
 *
 * This adds:
 * - Preprocessor definitions to disable Folly coroutines
 * - A sed command to directly patch RCT-Folly/Time.h to fix clockid_t
 */
function withFollyNoCoroutines(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');

      if (fs.existsSync(podfilePath)) {
        let podfileContent = fs.readFileSync(podfilePath, 'utf8');

        // Check if we already added the fix
        if (podfileContent.includes('FOLLY_CLOCKID_T_FIX')) {
          console.log('Folly clockid_t fix already applied');
          return config;
        }

        // Find the post_install block and add our fix
        const postInstallRegex = /(post_install\s+do\s+\|installer\|)/;

        // IMPORTANT: Ruby code must have correct indentation (2 spaces per level)
        // This fix:
        // 1. Patches Time.h to change __IPHONE_10_0 to __IPHONE_16_0 (fixes clockid_t)
        // 2. Sets deployment target to 16.0 for all pods
        // 3. Adds preprocessor definitions to disable Folly coroutines
        const follyFix = `$1
    # FOLLY_CLOCKID_T_FIX - Fix for Folly/Xcode 16+ compatibility
    # Patch Time.h to fix clockid_t typedef redefinition error
    # The issue is that iOS 16+ SDK defines clockid_t as enum, but Folly defines it as uint8_t
    time_h_path = "Pods/RCT-Folly/folly/portability/Time.h"
    if File.exist?(time_h_path)
      time_h_content = File.read(time_h_path)
      # Change the version check from iOS 10 to iOS 16 so the typedef is skipped
      modified_content = time_h_content.gsub('__IPHONE_10_0', '__IPHONE_16_0')
      File.write(time_h_path, modified_content)
      puts "Patched RCT-Folly Time.h to fix clockid_t typedef"
    end

    # Also try the Headers path (Xcode 15+ moved some headers)
    headers_time_h_path = "Pods/Headers/Private/RCT-Folly/folly/portability/Time.h"
    if File.exist?(headers_time_h_path)
      time_h_content = File.read(headers_time_h_path)
      modified_content = time_h_content.gsub('__IPHONE_10_0', '__IPHONE_16_0')
      File.write(headers_time_h_path, modified_content)
      puts "Patched RCT-Folly Headers Time.h to fix clockid_t typedef"
    end

    # Set deployment target at the project level
    installer.pods_project.build_configurations.each do |config|
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '16.0'
    end

    # Set deployment target and preprocessor definitions for each target
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        # Force iOS 16.0 deployment target
        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '16.0'

        # Add Folly preprocessor definitions
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FOLLY_NO_CONFIG=1'
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FOLLY_CFG_NO_COROUTINES=1'
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FOLLY_HAS_COROUTINES=0'
      end
    end
`;

        if (postInstallRegex.test(podfileContent)) {
          podfileContent = podfileContent.replace(postInstallRegex, follyFix);
          fs.writeFileSync(podfilePath, podfileContent);
          console.log('Applied Folly clockid_t fix to Podfile');
        } else {
          console.warn('Could not find post_install block in Podfile');
        }
      }

      return config;
    },
  ]);
}

module.exports = withFollyNoCoroutines;