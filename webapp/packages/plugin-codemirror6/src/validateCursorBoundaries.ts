/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ISelection } from './IReactCodemirrorProps.js';

export function validateCursorBoundaries(selection: ISelection, documentLength: number): ISelection {
  return {
    anchor: Math.min(selection.anchor, documentLength),
    head: selection.head === undefined ? undefined : Math.min(selection.head, documentLength),
  };
}
