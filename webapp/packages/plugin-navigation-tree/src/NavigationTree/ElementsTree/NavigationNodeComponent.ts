/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type React from 'react';

import type { NavNode } from '@cloudbeaver/core-navigation-tree';

import type { INavTreeNodeInfo } from './INavTreeNodeInfo.js';

export type NavTreeNodeComponent = React.FC<{
  nodeId: string;
  path: string[];
  dragging?: boolean;
  expanded?: boolean;
  big?: boolean;
  className?: string;
}>;

export type NavTreeControlProps = {
  node: NavNode;
  nodeInfo: INavTreeNodeInfo;
  dndElement?: boolean;
  dndPlaceholder?: boolean;
  expanded?: boolean;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
};

export type NavTreeControlComponent =
  | React.MemoExoticComponent<React.ForwardRefExoticComponent<React.PropsWithoutRef<NavTreeControlProps> & React.RefAttributes<HTMLDivElement>>>
  | React.ForwardRefExoticComponent<React.PropsWithoutRef<NavTreeControlProps> & React.RefAttributes<HTMLDivElement>>;

export type NavigationNodeComponent = React.FC<{
  node: NavNode;
  component: NavTreeNodeComponent;
  control?: NavTreeControlComponent | undefined;
  path: string[];
  dragging?: boolean;
  expanded?: boolean;
  className?: string;
}>;

export type NavigationNodeRendererComponent = React.FC<{
  nodeId: string;
  path: string[];
  component: NavTreeNodeComponent;
  expanded?: boolean;
  dragging?: boolean;
  className?: string;
}>;
