/**
 * @license
 * Cesium - https://github.com/CesiumGS/cesium
 * Version 1.131
 *
 * Copyright 2011-2022 Cesium Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Columbus View (Pat. Pend.)
 *
 * Portions licensed separately.
 * See https://github.com/CesiumGS/cesium/blob/main/LICENSE.md for full licensing details.
 */

import {
  BoxGeometry_default
} from "./chunk-PYI4Z7OX.js";
import "./chunk-D3WJH6EF.js";
import "./chunk-HWHEEBGN.js";
import "./chunk-XUSVIME7.js";
import "./chunk-ZHH7WJWF.js";
import "./chunk-VAZJ3S3Y.js";
import "./chunk-ZAEJ2APC.js";
import "./chunk-LVBAAA7Y.js";
import "./chunk-HPJTS3IN.js";
import "./chunk-SK5ZPCFM.js";
import "./chunk-Y4UZFTIJ.js";
import "./chunk-6ZILMWWT.js";
import "./chunk-GPIOZ7JH.js";
import {
  defined_default
} from "./chunk-OSUQRKTM.js";

// packages/engine/Source/Workers/createBoxGeometry.js
function createBoxGeometry(boxGeometry, offset) {
  if (defined_default(offset)) {
    boxGeometry = BoxGeometry_default.unpack(boxGeometry, offset);
  }
  return BoxGeometry_default.createGeometry(boxGeometry);
}
var createBoxGeometry_default = createBoxGeometry;
export {
  createBoxGeometry_default as default
};
