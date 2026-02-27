/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { Executor, type IExecutor } from '@cloudbeaver/core-executor';
import { GQLError, GraphQLService, PlainGQLError } from '@cloudbeaver/core-sdk';
import { errorOf } from '@cloudbeaver/core-utils';

import { NetworkError } from './NetworkError.js';

@injectable(() => [GraphQLService])
export class NetworkStateService extends Bootstrap {
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
      const gqlError = errorOf(exception, GQLError) ?? errorOf(exception, PlainGQLError);
      const statusCode = gqlError?.response.status;
      /* 
        GraphQL always returns a 200 status code, regardless of success or failure.
        Errors include an object with error details.
        the GraphQL client generates the 500 error due to no server response. A 500 status indicates either:
        - Server is not available (down)
        - Request timeout if it takes too long to get the response (e.g., no VPN connection, internet issues)
      */
      const isServerAvailable = statusCode && statusCode < 500;

      if (exception instanceof TypeError && exception.message === 'Failed to fetch') {
        throw new NetworkError('Error while processing request', { cause: exception });
      }

      if (!isServerAvailable) {
        throw new NetworkError('Server is not available. Please check your network connection and try again.', { cause: exception });
      }

      throw exception;
    }
  }
}
