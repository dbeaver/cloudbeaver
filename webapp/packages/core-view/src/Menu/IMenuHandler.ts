/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IDataContextProvider } from '../DataContext/IDataContextProvider';

export interface IMenuHandler {
  id: string;

  isApplicable: (context: IDataContextProvider) => boolean;
  isLoading?: (context: IDataContextProvider) => boolean;
  isDisabled?: (context: IDataContextProvider) => boolean;
  isHidden?: (context: IDataContextProvider) => boolean;
  handler?: (context: IDataContextProvider) => void;
}
