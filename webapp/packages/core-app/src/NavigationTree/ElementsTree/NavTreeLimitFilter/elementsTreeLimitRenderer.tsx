/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { useService } from '@cloudbeaver/core-di';
import { Translate } from '@cloudbeaver/core-localization';

import { NavTreeResource } from '../../../shared/NodesManager/NavTreeResource';
import type { NavigationNodeRendererComponent } from '../NavigationNodeComponent';
import { NAVIGATION_TREE_LIMIT } from './elementsTreeLimitFilter';

export function elementsTreeLimitRenderer(nodeId: string): NavigationNodeRendererComponent | undefined {
  if (nodeId === NAVIGATION_TREE_LIMIT.limit) {
    return ManageableGroup;
  }

  return;
}

const styles = css`
    connection-group {
      composes: theme-text-text-hint-on-light theme-typography--caption from global;
      padding: 4px 32px;
    }
  `;

const ManageableGroup: NavigationNodeRendererComponent = observer(function ManageableGroup() {
  const navTreeResource = useService(NavTreeResource);
  return styled(styles)(<connection-group><Translate token='app_navigationTree_limited' limit={navTreeResource.childrenLimit} /></connection-group>);
});
