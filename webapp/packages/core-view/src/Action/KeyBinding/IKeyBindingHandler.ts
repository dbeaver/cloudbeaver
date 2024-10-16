/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { DataContextGetter, IDataContextProvider } from '@cloudbeaver/core-data-context';

import type { IAction } from '../../Action/IAction.js';
import type { IKeyBinding } from './IKeyBinding.js';

export interface IKeyBindingHandler {
  id: string;
  binding: IKeyBinding;
  actions: Set<IAction>;
  contexts: Set<DataContextGetter<any>>;

  isBindingApplicable?: (context: IDataContextProvider, action: IAction) => boolean;
  handler: (context: IDataContextProvider, action: IAction) => void;
}

export interface IKeyBindingHandlerOptions extends Omit<IKeyBindingHandler, 'actions' | 'contexts'> {
  actions?: IAction[];
  contexts?: DataContextGetter<any>[];
}
