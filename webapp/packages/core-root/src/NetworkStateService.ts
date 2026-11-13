/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { Bootstrap, Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { Executor, type IExecutor } from '@cloudbeaver/core-executor';
import { GraphQLService } from '@cloudbeaver/core-sdk';
import { errorOf } from '@cloudbeaver/core-utils';

import { isNetworkFetchError, NetworkError } from './NetworkError.js';

export class NetworkStateServiceImpl extends Bootstrap {
  get state(): boolean {
    return this.networkState;
  }

  readonly networkStateExecutor: IExecutor<boolean>;
  private networkState: boolean;

  constructor(private readonly graphQLService: GraphQLService) {
    super();

    this.networkState = true;
    this.networkStateExecutor = new Executor();
    this.networkStateExecutor.setInitialDataGetter(() => this.state);

    makeObservable<NetworkStateService, 'networkState'>(this, {
      networkState: observable,
    });
  }

  override register(): void {
    this.networkState = window.navigator.onLine;

    window.addEventListener('online', () => this.setState(true));
    window.addEventListener('offline', () => this.setState(false));

    this.graphQLService.registerInterceptor(this.networkIssuesInterceptor.bind(this));
  }

  private setState(state: boolean) {
    if (this.networkState === state) {
      return;
    }

    if (state) {
      if (errorOf(this.graphQLService.client.blockReason, NetworkError)) {
        this.graphQLService.enableRequests();
      }
    } else {
      this.graphQLService.blockRequests(new NetworkError('Network connection was lost'));
    }

    this.networkState = state;
    this.networkStateExecutor.execute(this.networkState);
  }

  private async networkIssuesInterceptor(request: Promise<any>): Promise<any> {
    try {
      return await request;
    } catch (exception: any) {
      if (isNetworkFetchError(exception)) {
        throw new NetworkError('Server is not available. Please check your network connection and try again.', { cause: exception });
      }

      throw exception;
    }
  }
}

export type NetworkStateService = NetworkStateServiceImpl;

export class NetworkStateServiceDI extends Context.Service<NetworkStateServiceDI, NetworkStateServiceImpl>()(
  '@cloudbeaver/core-root/NetworkStateService#NetworkStateService',
) {
  static readonly implementation = NetworkStateServiceImpl;

  static readonly dependencies = () => [GraphQLService] as const;
  static readonly make: Effect.Effect<NetworkStateServiceImpl, never, Context.Service.Identifier<typeof GraphQLService>> = Effect.gen(
    function* makeNetworkStateService() {
      const graphQLService = yield* GraphQLService;

      return new NetworkStateServiceImpl(graphQLService);
    },
  );
  static readonly layer: Layer.Layer<NetworkStateServiceDI, never, Context.Service.Identifier<typeof GraphQLService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const NetworkStateService = NetworkStateServiceDI;
