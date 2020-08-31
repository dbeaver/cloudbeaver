/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import createRouter, {
  State, Router, SubscribeFn, SubscribeState
} from 'router5';
import browserPlugin from 'router5-plugin-browser';

import { injectable, Bootstrap } from '@cloudbeaver/core-di';

export type RouterState = State;

@injectable()
export class RouterService extends Bootstrap {

  get route() {
    return this.currentRoute;
  }

  get params() {
    return this.currentParams;
  }

  readonly router: Router;

  @observable private currentRoute = '';
  @observable private currentParams: Record<string, any> = {};

  constructor() {
    super();
    this.router = createRouter();

    this.configure();
  }

  start() {
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
    }));

    this.router.subscribe(this.onRouteChange.bind(this));
  }

  private onRouteChange(state: SubscribeState) {
    this.currentRoute = state.route.name;
    this.currentParams = state.route.params;
  }
}
