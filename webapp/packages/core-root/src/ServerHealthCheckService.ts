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
const HEALTH_CHECK_RETRY_COUNT = 3;
const HEALTH_CHECK_RETRY_PAUSE = 1000;

export enum ServerHealthStatus {
  Unknown = 'unknown',
  Alive = 'alive',
  Unavailable = 'unavailable',
}

@injectable(() => [GraphQLService])
export class ServerHealthCheckService extends Bootstrap {
  readonly onStatusChange: IExecutor<ServerHealthStatus>;
  private serverStatus: ServerHealthStatus;
  private isHealthCheckInProgress = false;

  constructor(private readonly graphQLService: GraphQLService) {
    super();

    this.serverStatus = ServerHealthStatus.Unknown;
    this.isHealthCheckInProgress = false;
    this.onStatusChange = new Executor();
    this.onStatusChange.setInitialDataGetter(() => this.serverStatus);

    makeObservable<ServerHealthCheckService, 'isHealthCheckInProgress' | 'serverStatus' | 'updateServerStatus'>(this, {
      serverStatus: observable,
      isHealthCheckInProgress: observable,
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
      await fetch(healthCheckUrl, { method: 'HEAD' });
      return ServerHealthStatus.Alive;
    } catch (_exception: unknown) {
      return ServerHealthStatus.Unavailable;
    }
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
      const isAlive = isNotNullDefined(status) && status < SERVER_ERROR_STATUS_CODE;

      /* graphql can send code 200 and error in body, so we need to check status code to be sure 
      that it is just error thrown, and not server is unavailable */
      if (isAlive) {
        this.updateServerStatus(ServerHealthStatus.Alive);
        return;
      }

      if (this.isHealthCheckInProgress) {
        return;
      }

      this.isHealthCheckInProgress = true;

      for (let i = 0; i < HEALTH_CHECK_RETRY_COUNT; i++) {
        const status = await this.healthCheckOrigin();

        if (status === ServerHealthStatus.Alive) {
          this.updateServerStatus(ServerHealthStatus.Alive);
          this.isHealthCheckInProgress = false;
          return;
        }

        if (status === ServerHealthStatus.Unavailable) {
          await new Promise(resolve => setTimeout(resolve, HEALTH_CHECK_RETRY_PAUSE));
        }
      }

      this.updateServerStatus(ServerHealthStatus.Unavailable);
      this.isHealthCheckInProgress = false;
    }
  }
}
