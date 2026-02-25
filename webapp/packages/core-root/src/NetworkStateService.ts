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
import { LocalizationService } from '@cloudbeaver/core-localization';

@injectable(() => [GraphQLService, LocalizationService])
export class NetworkStateService extends Bootstrap {
  get state(): boolean {
    return this.networkState;
  }

  readonly networkStateExecutor: IExecutor<boolean>;
  private networkState: boolean;

  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly localizationService: LocalizationService,
  ) {
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

    this.graphQLService.registerInterceptor(this.sessionExpiredInterceptor.bind(this));
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
      this.graphQLService.blockRequests(new NetworkError(this.localizationService.translate('core_root_network_connection_lost_error')));
    }
    this.networkState = state;
    this.networkStateExecutor.execute(this.networkState);
  }

  private async sessionExpiredInterceptor(request: Promise<any>): Promise<any> {
    try {
      return await request;
    } catch (exception: any) {
      const gqlError = errorOf(exception, GQLError) ?? errorOf(exception, PlainGQLError);
      const statusCode = gqlError?.response.status;
      const isServerAvailable = statusCode && statusCode < 500;

      if (exception instanceof TypeError && exception.message === 'Failed to fetch') {
        throw new NetworkError(this.localizationService.translate('core_root_network_error_while_processing'), { cause: exception });
      }

      if (!isServerAvailable) {
        throw new NetworkError(this.localizationService.translate('core_root_network_server_not_available'), { cause: exception });
      }

      throw exception;
    }
  }
}
