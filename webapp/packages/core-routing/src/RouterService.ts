/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable } from 'mobx';
import createRouter, {
  State, Router, SubscribeFn, SubscribeState
} from 'router5';
import browserPlugin from 'router5-plugin-browser';
import type { DoneFn } from 'router5/dist/types/base';

import { injectable, Bootstrap } from '@cloudbeaver/core-di';
import { Executor, ExecutorInterrupter, IExecutor } from '@cloudbeaver/core-executor';
import { GlobalConstants } from '@cloudbeaver/core-utils';

export type RouterState = State;

export interface RouterTransitionData {
  toState: RouterState;
  fromState: RouterState;
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

  constructor() {
    super();

    makeObservable<RouterService, 'currentState' | 'currentRoute' | 'currentParams'>(this, {
      currentState: observable,
      currentRoute: observable,
      currentParams: observable,
    });

    this.transitionTask = new Executor();
    this.router = createRouter();
    this.currentState = this.router.getState();

    this.configure();
  }

  start(): void {
    this.router.start();
  }

  subscribe(subscriber: SubscribeFn) {
    return this.router.subscribe(subscriber);
  }

  register(): void | Promise<void> { }
  load(): void | Promise<void> {
    this.start();
  }

  private configure() {
    this.router.usePlugin(browserPlugin({
      useHash: true,
      base: GlobalConstants.rootURI,
    }));

    this.router.subscribe(this.onRouteChange.bind(this));
    this.router.useMiddleware(() => async (
      fromState,
      toState,
      done
    ) => {
      const contexts = await this.transitionTask.execute({ fromState, toState, done });

      if (ExecutorInterrupter.isInterrupted(contexts)) {
        // eslint-disable-next-line prefer-promise-reject-errors
        return Promise.reject();
      }

      return Promise.resolve();
    }
    );
  }

  private onRouteChange(state: SubscribeState) {
    this.currentState = state.route;
    this.currentRoute = state.route.name;
    this.currentParams = state.route.params;
  }
}
