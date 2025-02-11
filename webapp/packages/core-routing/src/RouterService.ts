/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable, runInAction } from 'mobx';
import { createRouter, type Router, type State, type SubscribeFn, type SubscribeState } from 'router5';
import browserPlugin from 'router5-plugin-browser';
import type { DoneFn } from 'router5/dist/types/base.js';

import { App, Bootstrap, injectable } from '@cloudbeaver/core-di';
import { Executor, ExecutorInterrupter, type IExecutor } from '@cloudbeaver/core-executor';
import { GlobalConstants } from '@cloudbeaver/core-utils';

export type RouterState = State;

export interface RouterTransitionData {
  toState: RouterState;
  fromState: RouterState | null;
  done: DoneFn;
}

@injectable()
export class RouterService extends Bootstrap {
  get state(): RouterState {
    return this.currentState;
  }

  get route(): string {
    return this.currentRoute;
  }

  get params(): Record<string, any> {
    return this.currentParams;
  }

  readonly transitionTask: IExecutor<RouterTransitionData>;
  readonly router: Router;

  private currentState: RouterState;
  private currentRoute = '';
  private currentParams: Record<string, any> = {};

  constructor(private readonly app: App) {
    super();

    this.transitionTask = new Executor();
    this.router = createRouter();
    this.currentState = this.router.getState();

    this.configure();

    makeObservable<RouterService, 'currentState' | 'currentRoute' | 'currentParams'>(this, {
      currentState: observable,
      currentRoute: observable,
      currentParams: observable,
    });
  }

  start(): void {
    this.router.start();
  }

  subscribe(subscriber: SubscribeFn) {
    return this.router.subscribe(subscriber);
  }

  override load(): void {
    this.start();
  }

  reload(): void {
    this.app.restart();
    // this.router.navigate(
    //   this.route,
    //   this.params,
    //   {
    //     reload: true,
    //   }
    // );
  }

  private configure() {
    let root = GlobalConstants.rootURI;
    if (!root.endsWith('/')) {
      root = root + '/';
    }

    this.router.usePlugin(
      (browserPlugin as any)({
        useHash: true,
        base: root,
      }),
    );

    this.router.subscribe(this.onRouteChange.bind(this));
    this.router.useMiddleware(() => async (fromState, toState, done) => {
      const contexts = await this.transitionTask.execute({ fromState: toState, toState: fromState, done });

      if (ExecutorInterrupter.isInterrupted(contexts)) {
        return Promise.reject();
      }

      return Promise.resolve();
    });
  }

  private onRouteChange(state: SubscribeState) {
    runInAction(() => {
      this.currentState = state.route;
      this.currentRoute = state.route.name;
      this.currentParams = state.route.params;
    });
  }
}
