/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, makeObservable, observable } from 'mobx';

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { Executor, type IExecutor } from '@cloudbeaver/core-executor';
import { GQLError, GraphQLService, PlainGQLError } from '@cloudbeaver/core-sdk';
import { errorOf, GlobalConstants } from '@cloudbeaver/core-utils';
import { isNotNullDefined } from '@dbeaver/js-helpers';

const SERVER_ERROR_STATUS_CODE = 500;

export enum ServerHealthStatus {
  Unknown = 'unknown',
  Alive = 'alive',
  Unavailable = 'unavailable',
}

@injectable(() => [GraphQLService])
export class ServerHealthCheckService extends Bootstrap {
  readonly onStatusChange: IExecutor<ServerHealthStatus>;
  private serverStatus: ServerHealthStatus;

  constructor(private readonly graphQLService: GraphQLService) {
    super();

    this.serverStatus = ServerHealthStatus.Unknown;
    this.onStatusChange = new Executor();
    this.onStatusChange.setInitialDataGetter(() => this.serverStatus);

    makeObservable<ServerHealthCheckService, 'serverStatus' | 'updateServerStatus'>(this, {
      serverStatus: observable,
      status: computed,
      updateServerStatus: action.bound,
    });
  }

  get status(): ServerHealthStatus {
    return this.serverStatus;
  }

  override register(): void {
    this.graphQLService.registerInterceptor(this.healthCheckInterceptor.bind(this));
  }

  async healthCheckOrigin(): Promise<ServerHealthStatus> {
    const origin = window.location.origin;
    const healthCheckUrl = GlobalConstants.getHealthCheckUrl(origin);

    try {
      const response = await fetch(healthCheckUrl, { method: 'HEAD' });
      this.updateServerStatus(response.ok ? ServerHealthStatus.Alive : ServerHealthStatus.Unavailable);
    } catch (_exception: unknown) {
      this.updateServerStatus(ServerHealthStatus.Unavailable);
    }

    return this.serverStatus;
  }

  private updateServerStatus(status: ServerHealthStatus) {
    if (this.serverStatus === status) {
      return;
    }

    this.serverStatus = status;
    this.onStatusChange.execute(status);
  }

  private async healthCheckInterceptor(request: Promise<any>): Promise<any> {
    try {
      const response = await request;
      this.updateServerStatus(ServerHealthStatus.Alive);
      return response;
    } catch (exception: unknown) {
      const gqlError = errorOf(exception, GQLError) ?? errorOf(exception, PlainGQLError);
      const status = gqlError?.response?.status;

      if (isNotNullDefined(status)) {
        this.updateServerStatus(status < SERVER_ERROR_STATUS_CODE ? ServerHealthStatus.Alive : ServerHealthStatus.Unavailable);
        return;
      }

      const serverStatus = await this.healthCheckOrigin();
      this.updateServerStatus(serverStatus);
    }
  }
}
