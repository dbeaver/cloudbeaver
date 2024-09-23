/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';

import type { IActiveView } from './IActiveView.js';
import type { IView } from './IView.js';

@injectable()
export class ViewService {
  /** Current view in focus */
  get primaryView(): IActiveView<any> | null {
    return this.view?.getView() || null;
  }

  /** List of active views, the first element is primaryView */
  get activeViews(): IActiveView<any>[] {
    return this.activeViewList
      .slice()
      .sort((viewA, viewB) => {
        if (viewA === this.view) {
          return -1;
        }

        if (viewB === this.view) {
          return 1;
        }

        return 0;
      })
      .map(view => view.getView())
      .filter<IActiveView<any>>((view): view is IActiveView<any> => view !== null);
  }

  private view: IView<any> | null;
  private readonly activeViewList: IView<any>[];

  constructor() {
    this.view = null;
    this.activeViewList = [];

    makeObservable<this, 'view' | 'activeViewList'>(this, {
      view: observable.ref,
      activeViewList: observable.shallow,
      activeViews: computed,
    });
  }

  setPrimaryView(view: IView<any>): void {
    this.view = view;
  }

  blur(provider: IView<any>) {
    // if (this.view === provider) {
    //   this.view = null;
    // }
  }

  addActiveView(view: IView<any>): void {
    if (!this.activeViewList.includes(view)) {
      this.activeViewList.push(view);
    }
  }

  removeActiveVew(view: IView<any>): void {
    const index = this.activeViewList.indexOf(view);

    if (index !== -1) {
      this.activeViewList.splice(index, 1);
    }

    if (this.view === view) {
      this.view = null;
    }
  }
}
