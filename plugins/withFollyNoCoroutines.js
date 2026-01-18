const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin to fix Folly/Xcode 16+ compatibility issues:
 * 1. 'folly/coro/Coroutine.h' file not found error
 * 2. typedef redefinition error for clockid_t
 *
 * This adds preprocessor definitions to disable Folly coroutines
 * and forces iOS deployment target to 16.0 for all pods
 */
function withFollyNoCoroutines(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');

      if (fs.existsSync(podfilePath)) {
        let podfileContent = fs.readFileSync(podfilePath, 'utf8');

        // Check if we already added the fix
        if (podfileContent.includes('FOLLY_CFG_NO_COROUTINES')) {
          console.log('Folly no-coroutines fix already applied');
          return config;
        }

        // Find the post_install block and add our fix
        const postInstallRegex = /(post_install\s+do\s+\|installer\|)/;

        // IMPORTANT: Ruby code must have correct indentation (2 spaces per level)
        // Force iOS 16.0 deployment target for ALL configurations to fix clockid_t issue
        const follyFix = `$1
    # Fix for Folly/Xcode 16+ compatibility
    # 1. Disables Folly coroutines (fixes 'folly/coro/Coroutine.h' not found)
    # 2. Forces iOS 16.0 minimum (fixes clockid_t typedef redefinition)

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
          console.log('Applied Folly no-coroutines fix to Podfile');
        } else {
          console.warn('Could not find post_install block in Podfile');
        }
      }

      return config;
    },
  ]);
}

module.exports = withFollyNoCoroutines;