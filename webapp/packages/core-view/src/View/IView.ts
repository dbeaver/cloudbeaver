/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IAction } from '../Action/IAction';
import type { IActiveView } from './IActiveView';

export interface IView<T> {
  parent: IView<T> | null;
  actions: IAction[];
  getView: () => IActiveView<T> | null;
  registerAction: (action: IAction) => void;
}
