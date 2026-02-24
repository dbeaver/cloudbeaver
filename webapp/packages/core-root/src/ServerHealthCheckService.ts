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
  readonly onServerAliveChange: IExecutor<ServerHealthStatus>;
  private serverAlive: ServerHealthStatus;

  constructor(private readonly graphQLService: GraphQLService) {
    super();

    this.serverAlive = ServerHealthStatus.Unknown;
    this.onServerAliveChange = new Executor();
    this.onServerAliveChange.setInitialDataGetter(() => this.serverAlive);

    makeObservable<ServerHealthCheckService, 'serverAlive' | 'updateServerAliveStatus'>(this, {
      serverAlive: observable,
      serverStatus: computed,
      updateServerAliveStatus: action.bound,
    });
  }

  get serverStatus(): ServerHealthStatus {
    return this.serverAlive;
  }

  override register(): void {
    this.graphQLService.registerInterceptor(this.healthCheckInterceptor.bind(this));
  }

  async healthCheckOrigin(): Promise<ServerHealthStatus> {
    const currentOrigin = window.location.origin;
    const healthCheckUrl = GlobalConstants.getHealthCheckUrl(currentOrigin);

    try {
      const response = await fetch(healthCheckUrl, { method: 'HEAD' });
      this.updateServerAliveStatus(response.ok ? ServerHealthStatus.Alive : ServerHealthStatus.Unavailable);
    } catch (_exception: unknown) {
      this.updateServerAliveStatus(ServerHealthStatus.Unavailable);
    }

    return this.serverAlive;
  }

  private updateServerAliveStatus(status: ServerHealthStatus) {
    if (this.serverAlive === status) {
      return;
    }

    this.serverAlive = status;
    this.onServerAliveChange.execute(status);
  }

  private async healthCheckInterceptor(request: Promise<any>): Promise<any> {
    try {
      const response = await request;
      this.updateServerAliveStatus(ServerHealthStatus.Alive);
      return response;
    } catch (exception: unknown) {
      const gqlError = errorOf(exception, GQLError) ?? errorOf(exception, PlainGQLError);
      const status = gqlError?.response?.status;

      if (isNotNullDefined(status)) {
        this.updateServerAliveStatus(status < SERVER_ERROR_STATUS_CODE ? ServerHealthStatus.Alive : ServerHealthStatus.Unavailable);
        return;
      }

      const serverStatus = await this.healthCheckOrigin();
      this.updateServerAliveStatus(serverStatus);
    }
  }
}
