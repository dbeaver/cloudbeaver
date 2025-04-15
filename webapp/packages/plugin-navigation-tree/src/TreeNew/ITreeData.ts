/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { INode } from './INode.js';
import type { INodeState } from './INodeState.js';

export interface ITreeData {
  rootId: string;

  getNode(id: string): INode;
  getChildren: (node: string) => string[];
  getParent: (node: string) => string | null;
  getState(id: string): Readonly<INodeState>;

  updateAllState(state: Partial<INodeState>): void;
  updateState(id: string, state: Partial<INodeState>): void;
  load(nodeId: string, manual: boolean): Promise<void>;
  update(): Promise<void>;
}
