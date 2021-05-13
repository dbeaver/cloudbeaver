/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { Translate } from '@cloudbeaver/core-localization';
import { composes, useStyles } from '@cloudbeaver/core-theming';

import { NAVIGATION_TREE_CONNECTION_GROUPS } from './navigationTreeConnectionGroupFilter';
import type { ElementsTreeCustomRendererComponent } from './useElementsTree';

export function navigationTreeConnectionGroupRenderer(nodeId: string): ElementsTreeCustomRendererComponent | undefined {
  if (nodeId !== NAVIGATION_TREE_CONNECTION_GROUPS.manageable
  && nodeId !== NAVIGATION_TREE_CONNECTION_GROUPS.unmanageable) {
    return;
  }

  if (nodeId === NAVIGATION_TREE_CONNECTION_GROUPS.manageable) {
    return ManageableGroup;
  }

  return UnManageableGroup;
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
      padding: 4px 12px;

      &:not(:first-child) {
        margin-top: 8px;
      }
    }
  `
);

const ManageableGroup: ElementsTreeCustomRendererComponent = function ManageableGroup() {
  return styled(useStyles(styles))(<connection-group><Translate token='app_navigationTree_connection_group_user' /></connection-group>);
};
const UnManageableGroup: ElementsTreeCustomRendererComponent = function UnManageableGroup() {
  return styled(useStyles(styles))(<connection-group><Translate token='app_navigationTree_connection_group_shared' /></connection-group>);
};
