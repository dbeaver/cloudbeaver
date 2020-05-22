/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import createRouter, {
  Router, SubscribeFn, SubscribeState, State
} from 'router5';
import browserPlugin from 'router5-plugin-browser';

import { injectable } from '@dbeaver/core/di';

@injectable()
export class RouterService {

  get route() {
    return this.currentRoute;
  }

  readonly router: Router;

  @observable private currentRoute = '';

  constructor() {
    this.router = createRouter();

    this.configure();
  }

  start() {
    this.router.start();
  }

  subscribe(subscriber: SubscribeFn) {
    return this.router.subscribe(subscriber);
  }

  private configure() {
    this.router.usePlugin(browserPlugin({
      useHash: true,
    }));

    this.router.subscribe(this.onRouteChange.bind(this));
  }

  private onRouteChange(state: SubscribeState) {
    this.currentRoute = state.route.name;
  }
}
