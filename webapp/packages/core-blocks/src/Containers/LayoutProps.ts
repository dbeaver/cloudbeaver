/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface ILayoutSizeProps {
  keepSize?: boolean;
  limitWidth?: boolean;
  small?: boolean;
  medium?: boolean;
  large?: boolean;
  grow?: boolean;
}

export interface IGridItemsLayoutProps {
  gridItemMax?: boolean;
}

export interface IFlexItemsLayoutProps {
  flexItemKeepSize?: boolean;
  flexItemTiny?: boolean;
  flexItemSmall?: boolean;
  flexItemMedium?: boolean;
  flexItemLarge?: boolean;
}
export interface IGridOptions {
  noGap?: boolean;
  horizontal?: boolean;
  center?: boolean;
}
