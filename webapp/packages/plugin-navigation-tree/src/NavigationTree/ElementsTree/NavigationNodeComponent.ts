/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type React from 'react';

import type { NavNode } from '@cloudbeaver/core-navigation-tree';


export type NavTreeNodeComponent = React.FC<{
  nodeId: string;
  path: string[];
  dragging?: boolean;
  expanded?: boolean;
  className?: string;
}>;

export type NavTreeControlProps = {
  node: NavNode;
  dndElement?: boolean;
  dndPlaceholder?: boolean;
  expanded?: boolean;
  className?: string;
  ref?: React.Ref<HTMLDivElement> | undefined;
};

export type NavTreeControlComponent = React.FC<NavTreeControlProps>;

export type NavigationNodeComponent = React.FC<{
  node: NavNode;
  component: NavTreeNodeComponent;
  path: string[];
  dragging?: boolean;
  expanded?: boolean;
  className?: string;
}>;

export type NavigationNodeRendererComponent = React.FC<{
  nodeId: string;
  component: NavTreeNodeComponent;
  expanded?: boolean;
  dragging?: boolean;
  className?: string;
}>;
