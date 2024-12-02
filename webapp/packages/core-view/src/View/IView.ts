/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IAction } from '../Action/IAction.js';
import type { IActiveView } from './IActiveView.js';

export interface IView<T> {
  parent: IView<T> | null;
  actions: IAction[];
  getView: () => IActiveView<T> | null;
  registerAction: (action: IAction) => void;
}
