/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface ISaveImageOptions {
  width: number;
  height: number;
  left: number;
  top: number;
  /** Changes the resolution of the output PNG. Defaults to 1, the same dimensions as the source SVG. */
  scale?: number;
  /** Creates a PNG with the given background color. */
  backgroundColor?: string;
}
