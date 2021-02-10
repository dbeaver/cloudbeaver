/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import type { IExtension } from '@cloudbeaver/core-extensions';

export interface IActiveView<T> {
  context: T;
  extensions: Array<IExtension<T>>;
}

export type IActiveItemProvider<T> = () => IActiveView<T> | null;

@injectable()
export class ActiveViewService {
  private activeView: IActiveItemProvider<any> | null = null;

  constructor() {
    makeObservable<ActiveViewService, 'activeView'>(this, {
      activeView: observable,
    });
  }

  get view() {
    if (this.activeView) {
      return this.activeView();
    }
    return null;
  }

  setActive<T>(provider: IActiveItemProvider<T>) {
    this.activeView = provider;
  }

  blur<T>(provider: IActiveItemProvider<T>) {
    // if (this.activeView === provider) {
    //   this.activeView = null;
    // }
  }
}
