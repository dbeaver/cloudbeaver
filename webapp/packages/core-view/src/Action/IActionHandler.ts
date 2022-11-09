/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ILoadableState } from '@cloudbeaver/core-utils';

import type { IDataContextProvider } from '../DataContext/IDataContextProvider';
import type { IAction } from './IAction';
import type { IActionInfo } from './IActionInfo';

export interface IActionHandler {
  id: string;

  getActionInfo?: (context: IDataContextProvider, action: IAction) => IActionInfo;
  getLoader?: (context: IDataContextProvider, action: IAction) => ILoadableState[] | ILoadableState;

  isChecked?: (context: IDataContextProvider, action: IAction) => boolean;
  isLoading?: (context: IDataContextProvider, action: IAction) => boolean;
  isDisabled?: (context: IDataContextProvider, action: IAction) => boolean;
  isHidden?: (context: IDataContextProvider, action: IAction) => boolean;

  isActionApplicable: (context: IDataContextProvider, action: IAction) => boolean;
  handler: (context: IDataContextProvider, action: IAction) => void;

  /** @deprecated must be refactored (#1)*/
  isLabelVisible?: (context: IDataContextProvider, action: IAction) => boolean;
}
