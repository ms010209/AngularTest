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
  EllipseGeometry_default
} from "./chunk-AU5LXL6F.js";
import "./chunk-JFWWRZUR.js";
import "./chunk-IMF6BCGK.js";
import "./chunk-BF44BDI3.js";
import "./chunk-2X55GKAZ.js";
import "./chunk-PFP5KMMR.js";
import "./chunk-D3WJH6EF.js";
import "./chunk-HWHEEBGN.js";
import "./chunk-BOUULJGB.js";
import "./chunk-ILTKII7E.js";
import "./chunk-IBBIUKYY.js";
import "./chunk-XUSVIME7.js";
import "./chunk-ZHH7WJWF.js";
import "./chunk-VAZJ3S3Y.js";
import "./chunk-ZAEJ2APC.js";
import "./chunk-LVBAAA7Y.js";
import {
  Cartesian3_default,
  Ellipsoid_default
} from "./chunk-HPJTS3IN.js";
import "./chunk-SK5ZPCFM.js";
import "./chunk-Y4UZFTIJ.js";
import "./chunk-6ZILMWWT.js";
import "./chunk-GPIOZ7JH.js";
import {
  defined_default
} from "./chunk-OSUQRKTM.js";

// packages/engine/Source/Workers/createEllipseGeometry.js
function createEllipseGeometry(ellipseGeometry, offset) {
  if (defined_default(offset)) {
    ellipseGeometry = EllipseGeometry_default.unpack(ellipseGeometry, offset);
  }
  ellipseGeometry._center = Cartesian3_default.clone(ellipseGeometry._center);
  ellipseGeometry._ellipsoid = Ellipsoid_default.clone(ellipseGeometry._ellipsoid);
  return EllipseGeometry_default.createGeometry(ellipseGeometry);
}
var createEllipseGeometry_default = createEllipseGeometry;
export {
  createEllipseGeometry_default as default
};
