/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { Position } from 'codemirror';

import type { EditorState } from '@codemirror/state';

/** Use to convert between old-style positions and offsets */
export function posToOffset(doc: EditorState['doc'], pos: Position) {
  return doc.line(pos.line + 1).from + pos.ch;
}