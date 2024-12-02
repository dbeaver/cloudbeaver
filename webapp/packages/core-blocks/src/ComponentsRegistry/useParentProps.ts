/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useContext } from 'react';

import { ComponentsTreeContext } from './ComponentsTreeContext.js';

/**
 * experimental, can be changed
 */
export function useParentProps<T>(component: React.FC<T>): T | undefined {
  const tree = useContext(ComponentsTreeContext);

  for (let i = tree.length - 1; i >= 0; i--) {
    if (tree[i]!.component === component) {
      return tree[i]!.props as T;
    }
  }

  return undefined;
}
