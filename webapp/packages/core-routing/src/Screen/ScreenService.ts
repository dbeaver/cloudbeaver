/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { SubscribeState } from 'router5';

import { injectable } from '@cloudbeaver/core-di';

import { RouterService } from '../RouterService';
import { IScreen, ScreenRoute } from './IScreen';

@injectable()
export class ScreenService {

  get screen() {
    return this.getScreenByRoute(this.routerService.route);
  }

  private screens = new Map<string, IScreen>();
  private routeScreenMap = new Map<string, string>();

  constructor(
    private routerService: RouterService
  ) {
    this.routerService.subscribe(this.onRouteChange.bind(this));
  }

  navigateToRoot() {
    const screen = Array.from(this.screens.values())
      .find(screen => screen.root);

    if (screen) {
      this.routerService.router.navigate(screen.name);
    }
  }

  create(screen: IScreen) {
    if (this.screens.has(screen.name)) {
      return;
    }

    this.screens.set(screen.name, screen);
    this.addRoutes(screen.name, screen.routes);
  }

  addRoutes(screen: string, routes: ScreenRoute[]) {
    for (const route of routes) {
      this.routerService.router.add(route);
      this.routeScreenMap.set(route.name, screen);
    }
  }

  isActive(name: string): boolean {
    return this.screen?.name === name;
  }

  buildUrl(screen: string) {
    return this.routerService.router.buildUrl(screen);
  }

  getScreenByRoute(route: string) {
    const screen = this.routeScreenMap.get(route);
    if (!screen) {
      return undefined;
    }

    return this.screens.get(screen);
  }

  private async onRouteChange(state: SubscribeState) {
    if (state.previousRoute) {
      const previousScreen = this.getScreenByRoute(state.previousRoute.name);
      if (previousScreen && previousScreen.onDeactivate) {
        await previousScreen.onDeactivate();
      }
    }

    const nextScreen = this.getScreenByRoute(state.route.name);

    if (nextScreen && nextScreen.onActivate) {
      await nextScreen.onActivate();
    }
  }
}
