/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ComponentStyle } from '@cloudbeaver/core-theming';

export type NavNodeTransformViewComponent = React.FC<{
  nodeId: string;
  folderId: string;
  parents: string[];
  style?: ComponentStyle;
}>;

export type NavNodeTransformView = (
  nodeId: string,
  folderId: string,
  parents: string[]
) => NavNodeTransformViewComponent | undefined;

export type NavNodeFolderTransformFn = (
  nodeId: string,
  children: string[] | undefined
) => string[] | undefined;

export interface INavNodeFolderTransform {
  order?: number;
  tab?: NavNodeTransformView;
  panel?: NavNodeTransformView;
  transformer: NavNodeFolderTransformFn;
}
