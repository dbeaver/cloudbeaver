/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { Translate } from '@cloudbeaver/core-localization';
import { composes, useStyles } from '@cloudbeaver/core-theming';

import type { NavigationNodeRendererComponent } from '../NavigationNodeComponent';
import { NAVIGATION_TREE_LIMIT } from './elementsTreeLimitFilter';

export function elementsTreeLimitRenderer(nodeId: string): NavigationNodeRendererComponent | undefined {
  if (nodeId === NAVIGATION_TREE_LIMIT.limit) {
    return ManageableGroup;
  }

  return;
}

const styles = composes(
  css`
    connection-group {
      composes: theme-text-text-hint-on-light from global;
    }
  `,
  css`
    connection-group {
      composes: theme-typography--caption from global;
      padding: 4px 32px;
    }
  `
);

const ManageableGroup: NavigationNodeRendererComponent = function ManageableGroup() {
  return styled(useStyles(styles))(<connection-group><Translate token='app_navigationTree_limited' /></connection-group>);
};
