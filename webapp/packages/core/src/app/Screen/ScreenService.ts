/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { SubscribeState } from 'router5';

import { injectable } from '@dbeaver/core/di';

import { RouterService } from '../RouterService';
import { IScreen } from './IScreen';

@injectable()
export class ScreenService {

  get screen() {
    return this.screens.get(this.routerService.route);
  }

  private screens = new Map<string, IScreen>();

  constructor(
    private routerService: RouterService
  ) {
    this.routerService.subscribe(this.onRouteChange.bind(this));
  }

  add(screen: IScreen) {
    if (this.screens.has(screen.name)) {
      return;
    }

    this.screens.set(screen.name, screen);
    this.routerService.router.add({ name: screen.name, path: screen.path });
  }

  buildUrl(screen: string) {
    return this.routerService.router.buildUrl(screen);
  }

  private async onRouteChange(state: SubscribeState) {
    if (state.previousRoute) {
      const previousScreen = this.screens.get(state.previousRoute.name);
      if (previousScreen && previousScreen.onDeactivate) {
        await previousScreen.onDeactivate();
      }
    }

    const nextScreen = this.screens.get(state.route.name);

    if (nextScreen && nextScreen.onActivate) {
      await nextScreen.onActivate();
    }
  }
}
