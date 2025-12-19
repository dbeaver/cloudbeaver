/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { MetadataMap } from '@cloudbeaver/core-utils';

export type TreeSelectionType = 'click' | 'checkbox';

export interface INodeSelection {
  selected: boolean;
  indeterminate: boolean;
}

export interface ITreeSelectionBase {
  readonly type: TreeSelectionType;

  selectionState: MetadataMap<string, INodeSelection>;

  isSelected(nodeId: string): boolean;

  getSelection(nodeId: string): INodeSelection;

  clear(): Promise<void>;

  selectAll(): void | Promise<void>;
}

export interface ITreeClickSelection extends ITreeSelectionBase {
  readonly type: 'click';
  select(nodeId: string, multiple?: boolean, range?: boolean): Promise<void>;
}

export interface ITreeCheckboxSelection extends ITreeSelectionBase {
  readonly type: 'checkbox';
  select(nodeId: string, selected?: boolean): Promise<void>;
}

export type ITreeSelection = ITreeClickSelection | ITreeCheckboxSelection;
