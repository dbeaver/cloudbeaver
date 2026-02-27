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

const NO_NETWORK_MESSAGE = 'Failed to fetch';

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
      /* 
        GraphQL always returns a 200 status code, regardless of success or failure.
        The client app proxy (e.g. vite) returns a 500 status code only in dev mode (frontend build),
        In prod mode it throws a network error with a specific message.
      */
      const gqlError = errorOf(exception, GQLError) ?? errorOf(exception, PlainGQLError);
      const isGqlProxyError = gqlError?.response.status === 500 && (!gqlError.response.body || Object.keys(gqlError.response.body).length === 0);
      /* 
        fetch() API throws a TypeError when a network error occurs, and the message is 'Failed to fetch'. 
        This is a common way to detect network issues in web applications in prod mode (not dev frontend build) 
      */
      const isCommonNetworkError = exception instanceof TypeError && exception.message === NO_NETWORK_MESSAGE;

      if (isCommonNetworkError || isGqlProxyError) {
        throw new NetworkError('Server is not available. Please check your network connection and try again.', { cause: exception });
      }

      throw exception;
    }
  }
}
