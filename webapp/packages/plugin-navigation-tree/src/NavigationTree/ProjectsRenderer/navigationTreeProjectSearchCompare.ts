/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { NAV_NODE_TYPE_PROJECT } from '@cloudbeaver/core-projects';

import { elementsTreeNameFilterNode } from '../ElementsTree/elementsTreeNameFilter';
import { EEquality, type NavNodeFilterCompareFn } from '../ElementsTree/NavNodeFilterCompareFn';

export const navigationTreeProjectSearchCompare: NavNodeFilterCompareFn = function navigationTreeProjectSearchCompare(node, filter) {
  if (node.nodeType === NAV_NODE_TYPE_PROJECT) {
    return EEquality.none;
  }

  return elementsTreeNameFilterNode(node, filter);
};
