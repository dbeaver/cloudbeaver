/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ButtonHTMLAttributes } from 'react';

import type { IContextMenuPosition } from '@cloudbeaver/core-blocks';
import type { IMenuData } from '@cloudbeaver/core-view';
import type { MenuProviderProps } from '@dbeaver/ui-kit';

export interface IContextMenuBaseProps extends React.PropsWithChildren {
  loading: boolean;
  disabled: boolean;
}

export type ContextMenuRenderingChildren = (props: IContextMenuBaseProps) => React.ReactNode | React.ReactElement;

export interface IContextMenuProps extends Omit<ButtonHTMLAttributes<any>, 'children'> {
  contextMenuPosition?: IContextMenuPosition;
  menu: IMenuData;
  disclosure?: boolean;
  placement?: MenuProviderProps['placement'];
  modal?: boolean;
  visible?: boolean;
  rtl?: boolean;
  children?: React.ReactNode | ContextMenuRenderingChildren;
  onVisibleSwitch?: (visible: boolean) => void;
}
