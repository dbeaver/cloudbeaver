/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type React from 'react';

import type { NavNode } from '@cloudbeaver/core-navigation-tree';
import type { ComponentStyle } from '@cloudbeaver/core-theming';

import type { INavTreeNodeInfo } from './INavTreeNodeInfo';

export type NavTreeNodeComponent = React.FC<{
  nodeId: string;
  path: string[];
  dragging?: boolean;
  expanded?: boolean;
  className?: string;
}>;

export type NavTreeControlProps = {
  node: NavNode;
  nodeInfo: INavTreeNodeInfo;
  dndElement?: boolean;
  dndPlaceholder?: boolean;
  expanded?: boolean;
  className?: string;
  style?: ComponentStyle;
  ref?: React.Ref<HTMLDivElement> | undefined;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
};

export type NavTreeControlComponent = React.FC<NavTreeControlProps>;

export type NavigationNodeComponent = React.FC<{
  node: NavNode;
  component: NavTreeNodeComponent;
  control?: NavTreeControlComponent | undefined;
  path: string[];
  dragging?: boolean;
  expanded?: boolean;
  className?: string;
  style?: ComponentStyle;
}>;

export type NavigationNodeRendererComponent = React.FC<{
  nodeId: string;
  path: string[];
  component: NavTreeNodeComponent;
  expanded?: boolean;
  dragging?: boolean;
  className?: string;
}>;
