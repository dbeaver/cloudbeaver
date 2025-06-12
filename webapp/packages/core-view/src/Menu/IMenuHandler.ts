/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { DataContextGetter, IDataContextProvider } from '@cloudbeaver/core-data-context';
import type { ILoadableState } from '@cloudbeaver/core-utils';

import type { IMenu } from './IMenu.js';
import type { MenuSubMenuItemIconComponent } from './MenuItem/IMenuSubMenuItem.js';
import type { IMenuInfo } from './IMenuInfo.js';

export interface IMenuHandler<TExtraProps = unknown> {
  id: string;
  menus: Set<IMenu>;
  contexts: Set<DataContextGetter<any>>;

  getInfo?: (context: IDataContextProvider, menu: IMenu) => IMenuInfo;
  getLoader?: (context: IDataContextProvider, menu: IMenu) => ILoadableState[] | ILoadableState;
  getExtraProps?: () => TExtraProps;
  iconComponent?: () => MenuSubMenuItemIconComponent<TExtraProps>;
  isApplicable?: (context: IDataContextProvider) => boolean;
  isLoading?: (context: IDataContextProvider) => boolean;
  isDisabled?: (context: IDataContextProvider) => boolean;
  isHidden?: (context: IDataContextProvider) => boolean;
  hideIfEmpty?: (context: IDataContextProvider) => boolean;
  handler?: (context: IDataContextProvider) => void;

  /** @deprecated must be refactored (#1)*/
  isLabelVisible?: (context: IDataContextProvider, menu: IMenu) => boolean;
}

export interface IMenuHandlerOptions<TExtraProps = unknown> extends Omit<IMenuHandler<TExtraProps>, 'menus' | 'contexts'> {
  menus?: IMenu[];
  contexts?: DataContextGetter<any>[];
}
