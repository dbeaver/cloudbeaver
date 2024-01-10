/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { NAV_NODE_TYPE_RM_PROJECT } from '@cloudbeaver/core-resource-manager';
import { EEquality, elementsTreeNameFilterNode, NavNodeFilterCompareFn } from '@cloudbeaver/plugin-navigation-tree';

export const navigationTreeProjectSearchCompare: NavNodeFilterCompareFn = function navigationTreeProjectSearchCompare(tree, node, filter) {
  if (node.nodeType === NAV_NODE_TYPE_RM_PROJECT) {
    return EEquality.none;
  }

  return elementsTreeNameFilterNode(tree, node, filter);
};
