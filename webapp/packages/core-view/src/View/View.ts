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
  readonly parent: IView<T> | null;
  readonly actions: IAction[];

  constructor(parent: IView<T> | null = null) {
    this.parent = parent;
    this.actions = observable([], { deep: false });
  }

  registerAction(...actions: IAction[]): this {
    this.actions.push(...actions);
    return this;
  }

  abstract getView(): IActiveView<T> | null;
}
