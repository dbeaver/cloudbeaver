/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable } from 'mobx';
import type { SubscribeState } from 'router5';

import { injectable } from '@cloudbeaver/core-di';
import { Executor, ExecutorInterrupter, type IExecutionContextProvider, type IExecutor } from '@cloudbeaver/core-executor';

import { RouterService, type RouterTransitionData } from '../RouterService.js';
import type { IScreen, ScreenRoute } from './IScreen.js';

@injectable()
export class ScreenService {
  get screen(): IScreen<any> | undefined {
    return this.getScreenByRoute(this.routerService.route);
  }

  readonly routeChange: IExecutor;

  private readonly screens: Map<string, IScreen<any>>;
  private readonly routeScreenMap: Map<string, string>;

  constructor(readonly routerService: RouterService) {
    this.routeChange = new Executor();
    this.screens = new Map<string, IScreen<any>>();
    this.routeScreenMap = new Map<string, string>();
    this.routerService.subscribe(this.onRouteChange.bind(this));
    this.routerService.transitionTask.addHandler(this.routeTransition.bind(this));

    this.navigateToRoot = this.navigateToRoot.bind(this);

    makeObservable(this, {
      screen: computed,
    });
  }

  navigateToRoot(): void {
    const screen = Array.from(this.screens.values()).find(screen => screen.root);

    if (screen) {
      this.routerService.router.navigate(screen.name);
    }
  }

  navigateToScreen(screen: string, item?: string, sub?: string, param?: string): void {
    this.routerService.router.navigate(screen, { item, sub, param });
  }

  navigate(screen: string, params?: Record<string, any>) {
    this.routerService.router.navigate(screen, params as any);
  }

  create<T extends Record<string, any>>(screen: IScreen<T>): void {
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

  buildUrl(screen: string, params?: Record<string, any>): string {
    return this.routerService.router.buildUrl(screen, params);
  }

  getScreenByRoute(route: string): IScreen<any> | undefined {
    const screen = this.routeScreenMap.get(route);
    if (!screen) {
      return undefined;
    }

    return this.screens.get(screen);
  }

  private async routeTransition(data: RouterTransitionData, contexts: IExecutionContextProvider<RouterTransitionData>): Promise<void> {
    if (!data.fromState) {
      return;
    }

    const screen = this.getScreenByRoute(data.fromState.name);

    if (screen?.canDeActivate) {
      const canDeactivate = await screen.canDeActivate(data.fromState, data.toState);

      if (!canDeactivate) {
        ExecutorInterrupter.interrupt(contexts);
      }
    }
  }

  private async onRouteChange(state: SubscribeState) {
    await this.routeChange.execute();

    if (state.previousRoute) {
      await this.getScreenByRoute(state.previousRoute.name)?.onDeactivate?.(state.previousRoute, state.route);
    }

    await this.getScreenByRoute(state.route.name)?.onActivate?.(state.route, state.previousRoute);
  }
}
