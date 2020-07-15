/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { IExtension } from '@cloudbeaver/core-extensions';

export interface IActiveView<T> {
  context: T;
  extensions: IExtension<T>[];
}

export interface IActiveItemProvider<T> {
  (): IActiveView<T> | null;
}

@injectable()
export class ActiveViewService {
  @observable private activeView: IActiveItemProvider<any> | null = null;

  get view() {
    if (this.activeView) {
      return this.activeView();
    }
    return null;
  }

  setActive<T>(provider: IActiveItemProvider<T>) {
    this.activeView = provider;
  }

  blur() { }
}
