/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import type { IAction } from '../Action/IAction';
import type { IActiveView } from './IActiveView';
import type { IView } from './IView';

export abstract class View<T> implements IView<T> {
  readonly actions: IAction[];

  constructor() {
    this.actions = observable([], { deep: false });
  }

  registerAction(action: IAction): void {
    this.actions.push(action);
  }

  abstract getView(): IActiveView<T> | null;
}
