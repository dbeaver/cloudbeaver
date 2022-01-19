/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';

import type { IActiveView } from './IActiveView';
import type { IView } from './IView';

@injectable()
export class ViewService {
  get activeView(): IActiveView<any> | null {
    return this.view?.getView() || null;
  }

  private view: IView<any> | null = null;

  constructor() {
    this.view = null;

    makeObservable<this, 'view'>(this, {
      view: observable.ref,
    });
  }

  setView(view: IView<any>): void {
    this.view = view;
  }

  blur(provider: IView<any>) {
    // if (this.activeView === provider) {
    //   this.activeView = null;
    // }
  }
}
