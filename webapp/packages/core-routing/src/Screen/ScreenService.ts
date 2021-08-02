/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { SubscribeState } from 'router5';

import { injectable } from '@cloudbeaver/core-di';
import { Executor, IExecutor } from '@cloudbeaver/core-executor';

import { RouterService } from '../RouterService';
import type { IScreen, ScreenRoute } from './IScreen';

@injectable()
export class ScreenService {
  get screen(): IScreen | undefined {
    return this.getScreenByRoute(this.routerService.route);
  }

  readonly routeChange: IExecutor;

  private screens = new Map<string, IScreen>();
  private routeScreenMap = new Map<string, string>();

  constructor(
    readonly routerService: RouterService
  ) {
    this.routeChange = new Executor();
    this.routerService.subscribe(this.onRouteChange.bind(this));
  }

  navigateToRoot(): void {
    const screen = Array.from(this.screens.values())
      .find(screen => screen.root);

    if (screen) {
      this.routerService.router.navigate(screen.name);
    }
  }

  navigate(screen: string, item?: string, sub?: string, param?: string): void {
    this.routerService.router.navigate(screen, { item, sub, param });
  }

  create(screen: IScreen): void {
    if (this.screens.has(screen.name)) {
      return;
    }

    this.screens.set(screen.name, screen);
    this.addRoutes(screen.name, screen.routes);
  }

  addRoutes(screen: string, routes: ScreenRoute[]): void {
    for (const route of routes) {
      this.routerService.router.add(route);
      this.routeScreenMap.set(route.name, screen);
    }
  }

  isActive(name: string): boolean;
  isActive(routeName: string, name: string): boolean;
  isActive(routeName: string, name?: string): boolean {
    if (name === undefined) {
      name = routeName;
      routeName = this.routerService.route;
    }
    const screen = this.getScreenByRoute(routeName);
    return screen?.name === name;
  }

  buildUrl(screen: string): string {
    return this.routerService.router.buildUrl(screen);
  }

  getScreenByRoute(route: string): IScreen | undefined {
    const screen = this.routeScreenMap.get(route);
    if (!screen) {
      return undefined;
    }

    return this.screens.get(screen);
  }

  private async onRouteChange(state: SubscribeState) {
    await this.routeChange.execute();

    if (state.previousRoute) {
      await this.getScreenByRoute(state.previousRoute.name)?.onDeactivate?.(state.previousRoute, state.route);
    }

    await this.getScreenByRoute(state.route.name)?.onActivate?.(state.route, state.previousRoute);
  }
}
