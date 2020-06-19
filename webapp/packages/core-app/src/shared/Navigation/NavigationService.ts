/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';

import { INavigationHandler } from './INavigationHandler';
import { INavigator, NavigatorIdentifierGetter } from './INavigator';
import { Navigator } from './Navigator';

@injectable()
export class NavigationService {
  private navigators: INavigator<any>[] = [];

  createNavigator<T>(
    getIdentifier?: NavigatorIdentifierGetter<T> | null,
    handler?: INavigationHandler<T> | null,
    defaultData?: T | null
  ) {
    const navigator = new Navigator(getIdentifier, handler, defaultData);
    this.navigators.push(navigator);
    return navigator;
  }
}
