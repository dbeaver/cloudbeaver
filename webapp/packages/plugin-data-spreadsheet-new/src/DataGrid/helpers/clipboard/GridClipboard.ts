/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable, action, makeObservable } from 'mobx';

import type { IGridDataKey } from '@cloudbeaver/plugin-data-viewer';

import type { ICopiedRegion } from './types.js';

export class GridClipboard {
  /** Observable region for visual highlight (dashed border). Set on copy, cleared on edit/Escape. */
  copiedRegion: ICopiedRegion | null = null;

  /** Set of serialized cell keys for O(1) lookup */
  private copiedCellKeys: Set<string> | null = null;

  constructor() {
    makeObservable(this, {
      copiedRegion: observable.ref,
      setCopiedRegion: action,
      clear: action,
    });
  }

  setCopiedRegion(region: ICopiedRegion): void {
    this.copiedRegion = region;
    this.copiedCellKeys = new Set(region.cells.flatMap(row => row.map(cell => this.serializeKey(cell.sourceKey))));
  }

  clear(): void {
    this.copiedRegion = null;
    this.copiedCellKeys = null;
  }

  isCopiedCell(key: IGridDataKey): boolean {
    return this.copiedCellKeys?.has(this.serializeKey(key)) ?? false;
  }

  private serializeKey(key: IGridDataKey): string {
    return `${key.row.index}:${key.row.subIndex ?? 0}:${key.column.index}`;
  }
}
