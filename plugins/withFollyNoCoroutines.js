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
const { withDangerousMod } = require('@expo/config-plugins');
                const fs = require('fs');
                const path = require('path');

                /**
                 * Expo config plugin to fix the Folly coroutine error:
                  * 'folly/coro/Coroutine.h' file not found
                   *
                    * This adds preprocessor definitions to disable Folly coroutines
                     * which are not compatible with Xcode 16+ and React Native 0.80+
                      * 
                       * Also fixes the typedef redefinition error by setting minimum iOS deployment target
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
                                                                # Also sets minimum iOS deployment target to 15.1 to fix typedef redefinition error
                                                                    installer.pods_project.targets.each do |target|
                                                                          target.build_configurations.each do |config|
                                                                                  config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
                                                                                          config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FOLLY_NO_CONFIG=1'
                                                                                                  config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FOLLY_CFG_NO_COROUTINES=1'
                                                                                                          config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FOLLY_HAS_COROUTINES=0'
                                                                                                                  # Set minimum iOS deployment target to 15.1 to avoid clockid_t typedef conflict
                                                                                                                          if config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f < 15.1
                                                                                                                                    config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'
                                                                                                                                            end
                                                                                                                                                  end
                                                                                                                                                      end
                                                                                                                                                      `;

                                                    if (cpoonssttI n{s twailtlhRDeagnegxe.rtoeusstM(opdo d}f i=l erCeoqnutiernet()')@ e{x
                                                        p o / c o n f i g - pploudgfiinlse'C)o;n
                                                        tceonnts t=  fpso d=f irleeqCuoinrtee(n'tf.sr'e)p;l
                                            accoen(spto sptaItnhs t=a lrleRqeugierxe,( 'fpoaltlhy'F)i;x
                                            )
                                            ;/
                                            * * 
                             *   E x p o  fcso.nwfriigt epFliulgeiSny ntco( pfoidxf itlheeP aFtohl,l yp ocdofrioluetCionnet eenrtr)o;r
                    : 
                         *   ' f o l l yc/ocnosrool/eC.olroogu(t'i✅n eA.php'l ifeidl eF onlolty  fnoou-ncdo
                          r o*u
                    t i*n eTsh ifsi xa dtdos  Ppordefpirloec'e)s;s
                        o r   d e f i n i}t ieolnsse  t{o
                                                          d i s a b l e   F oclolnys ocloer.owuatrinn(e's⚠️
                                                                C*o uwlhdi cnho ta rfei nndo tp ocsotm_piantsitballel  wbiltohc kX ciond eP o1d6f+i laen'd) ;R
                                                              e a c t   N a t i}v
                e   0 . 8 0 +}


              *   
                 *   Arlestou rfni xceosn ftihge; 
        t y p e d}e,f
  r e]d)e;f
i}n
i
tmioodnu leer.reoxrp obryt ss e=t twiintgh FmoilnliymNuomC oirOoSu tdienpelso;yment target
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
                                                    # Also sets minimum iOS deployment target to 15.1 to fix typedef redefinition error
                                                        installer.pods_project.targets.each do |target|
                                                              target.build_configurations.each do |config|
                                                                      config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
                                                                              config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FOLLY_NO_CONFIG=1'
                                                                                      config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FOLLY_CFG_NO_COROUTINES=1'
                                                                                              config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FOLLY_HAS_COROUTINES=0'
                                                                                                      # Set minimum iOS deployment target to 15.1 to avoid clockid_t typedef conflict
                                                                                                              if config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f < 15.1
                                                                                                                        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'
                                                                                                                                end
                                                                                                                                      end
                                                                                                                                          end
                                                                                                                                          `;

                                        if (postInstallRegex.test(podfileContent)) {
                                                      podfileContent = podfileContent.replace(postInstallRegex, follyFix);
                                                      fs.writeFileSync(podfilePath, podfileContent);
                                                      console.log('✅ Applied Folly no-coroutines fix to Podfile');
                                        } else {
                                                      console.warn('⚠️ Could not find post_install block in Podfile');
                                        }
                            }

                            return config;
                  },
                ]);
    }

module.exports = withFollyNoCoroutines;
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
