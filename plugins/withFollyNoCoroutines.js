const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin to fix the Folly coroutine error:
 * 'folly/coro/Coroutine.h' file not found
 *
 * This adds preprocessor definitions to disable Folly coroutines
 * which are not compatible with Xcode 16+ and React Native 0.80+
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

                    const follyFix = `$1
                        # Fix for 'folly/coro/Coroutine.h' file not found error
                            # Disables Folly coroutines which are incompatible with Xcode 16+
                                installer.pods_project.targets.each do |target|
                                      target.build_configurations.each do |config|
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
