/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { Executor, IExecutor } from '@cloudbeaver/core-executor';
import { GraphQLService } from '@cloudbeaver/core-sdk';

import { NetworkError } from './NetworkError';

@injectable()
export class NetworkStateService extends Bootstrap {
  get state(): boolean {
    return this.networkState;
  }

  readonly networkStateExecutor: IExecutor<boolean>;
  private networkState: boolean;

  constructor(
    private graphQLService: GraphQLService
  ) {
    super();
    makeObservable<NetworkStateService, 'networkState'>(this, {
      networkState: observable,
    });

    this.networkState = true;
    this.networkStateExecutor = new Executor();
  }

  register(): void {
    this.networkState = window.navigator.onLine;

    window.addEventListener('online', () => this.setState(true));
    window.addEventListener('offline', () => this.setState(false));

    this.graphQLService.registerInterceptor(this.sessionExpiredInterceptor.bind(this));
  }

  load(): void {}

  private setState(state: boolean) {
    if (this.networkState === state) {
      return;
    }

    if (state) {
      if (this.graphQLService.client.blockReason instanceof NetworkError) {
        this.graphQLService.enableRequests();
      }
    } else {
      this.graphQLService.blockRequests(new NetworkError('Network connection was lost'));
    }
    this.networkState = state;
    this.networkStateExecutor.execute(this.networkState);
  }

  private async sessionExpiredInterceptor(request: Promise<any>): Promise<any> {
    try {
      return await request;
    } catch (exception: any) {
      if (
        exception instanceof TypeError
        && exception.message === 'Failed to fetch'
      ) {
        throw new NetworkError('Error while processing request');
      }
      throw exception;
    }
  }
}
