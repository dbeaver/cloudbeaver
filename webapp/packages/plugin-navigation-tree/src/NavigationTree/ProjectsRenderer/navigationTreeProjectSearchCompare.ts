/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { isProjectNode } from '@cloudbeaver/core-navigation-tree';

import { elementsTreeNameFilterNode } from '../ElementsTree/elementsTreeNameFilter.js';
import { EEquality, type NavNodeFilterCompareFn } from '../ElementsTree/NavNodeFilterCompareFn.js';

export const navigationTreeProjectSearchCompare: NavNodeFilterCompareFn = function navigationTreeProjectSearchCompare(tree, node, filter) {
  if (isProjectNode(node)) {
    return EEquality.none;
  }

  return elementsTreeNameFilterNode(tree, node, filter);
};
