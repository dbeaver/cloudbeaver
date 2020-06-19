/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { INavigationHandler } from './INavigationHandler';
import { NavigatorIdentifierGetter, NavigatorIdentifier, INavigator } from './INavigator';
import { NavigationContext } from './NavigationContext';

export class Navigator<T> implements INavigator<T> {
  private lock: NavigatorIdentifier[] = []
  private handlers: INavigationHandler<any>[] = [];

  constructor(
    private getIdentifier?: NavigatorIdentifierGetter<T> | null,
    handler?: INavigationHandler<T> | null,
    private defaultData?: T | null
  ) {
    if (handler) {
      this.handlers.push(handler);
    }
  }

  async navigateTo(data: T) {
    if ((data === undefined || data === null) && this.defaultData !== undefined && this.defaultData !== null) {
      data = this.defaultData;
    }

    if (this.getIdentifier) {
      const identifier = this.getIdentifier(data);
      if (this.lock.includes(identifier)) {
        return;
      }
      this.lock.push(identifier);
      try {
        await this.callHandlers(data);
      } finally {
        this.lock = this.lock.filter(u => u !== identifier);
      }
    } else {
      await this.callHandlers(data);
    }
  }

  addHandler(handler: INavigationHandler<T>) {
    this.handlers.push(handler);
  }

  private async callHandlers(data: T) {
    const context = new NavigationContext(data);

    for (const handler of this.handlers) {
      await handler(context, data);
    }
  }
}
