/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ILoadableState } from '@cloudbeaver/core-utils';

import type { IDataContextProvider } from '../DataContext/IDataContextProvider';
import type { IMenu } from './IMenu';
import type { MenuSubMenuItemIconComponent } from './MenuItem/IMenuSubMenuItem';

export interface IMenuHandler<TExtraProps = unknown> {
  id: string;

  getInfo?: (context: IDataContextProvider, menu: IMenu) => IMenu;
  getLoader?: (context: IDataContextProvider, menu: IMenu) => ILoadableState[] | ILoadableState;
  getExtraProps?: () => TExtraProps;
  iconComponent?: () => MenuSubMenuItemIconComponent<TExtraProps>;
  isApplicable: (context: IDataContextProvider) => boolean;
  isLoading?: (context: IDataContextProvider) => boolean;
  isDisabled?: (context: IDataContextProvider) => boolean;
  isHidden?: (context: IDataContextProvider) => boolean;
  handler?: (context: IDataContextProvider) => void;

  /** @deprecated must be refactored (#1)*/
  isLabelVisible?: (context: IDataContextProvider, menu: IMenu) => boolean;
}
