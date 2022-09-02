#!/usr/bin/env node

      import {createRequire as __cjsCompatRequire} from 'module';
      const require = __cjsCompatRequire(import.meta.url);
      const __ESM_IMPORT_META_URL__ = import.meta.url;
    
import {
  parseCommandLineOptions
} from "../chunk-ICPLY7FO.js";
import {
  mainNgcc
} from "../chunk-KH76E4BH.js";
import "../chunk-HMWNYAAE.js";
import "../chunk-6CDTGQDE.js";
import "../chunk-UXC2H2UF.js";
import "../chunk-NESWWMC7.js";
import "../chunk-V6TOSKSY.js";
import "../chunk-5FZBUSFV.js";
import "../chunk-56O2PTWU.js";
import "../chunk-TYIM47SK.js";
import "../chunk-4NRCP3Y6.js";
import "../chunk-OLV72TYD.js";
import "../chunk-XYNRD7NE.js";

// bazel-out/darwin_arm64-fastbuild/bin/packages/compiler-cli/ngcc/main-ngcc.mjs
process.title = "ngcc";
var startTime = Date.now();
var options = parseCommandLineOptions(process.argv.slice(2));
(async () => {
  try {
    await mainNgcc(options);
    if (options.logger) {
      const duration = Math.round((Date.now() - startTime) / 1e3);
      options.logger.debug(`Run ngcc in ${duration}s.`);
    }
    process.exitCode = 0;
  } catch (e) {
    console.error(e.stack || e.message);
    process.exit(typeof e.code === "number" ? e.code : 1);
  }
})();
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
//# sourceMappingURL=main-ngcc.js.map
