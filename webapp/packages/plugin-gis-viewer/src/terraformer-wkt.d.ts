/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

declare module '@terraformer/wkt' {
  import * as terraformer from '@terraformer/wkt';

  export function wktToGeoJSON(wkt: string): GeoJSON.GeometryObject;
  export function GeoJSONToWkt(geoJSON: GeoJSON.GeometryObject): string;

}
