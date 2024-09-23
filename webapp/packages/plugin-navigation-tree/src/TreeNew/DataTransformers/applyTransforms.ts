/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ITreeData } from '../ITreeData.js';
import type { TreeDataTransformer } from './TreeDataTransformer.js';

export function applyTransforms<T>(treeData: ITreeData, id: string, data: T, transformers?: TreeDataTransformer<T>[]) {
  if (!transformers) {
    return data;
  }

  for (const transformer of transformers) {
    data = transformer(treeData, id, data);
  }

  return data;
}
