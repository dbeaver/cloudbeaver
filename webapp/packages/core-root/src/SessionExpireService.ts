/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { Executor, type IExecutor } from '@cloudbeaver/core-executor';
import { EServerErrorCode, GQLError, GraphQLService, SessionError } from '@cloudbeaver/core-sdk';
import { errorOf } from '@cloudbeaver/core-utils';
import { makeObservable, observable } from 'mobx';

export const SESSION_EXPIRE_MIN_TIME = 5 * 1000 * 60;

export class SessionExpireServiceImpl extends Bootstrap {
  private isExpired = false;

  onSessionExpire: IExecutor;
  constructor(private readonly graphQLService: GraphQLService) {
    super();

    this.sessionExpired = this.sessionExpired.bind(this);

    this.onSessionExpire = new Executor();
    makeObservable<this, 'isExpired'>(this, {
      isExpired: observable,
    });
  }

  get expired(): boolean {
    return this.isExpired;
  }

  override register(): void {
    this.graphQLService.registerInterceptor(this.sessionExpiredInterceptor.bind(this));
  }

  sessionExpired(): void {
    if (this.expired) {
      return;
    }

    const e = new SessionError('Session expired');
    this.graphQLService.blockRequests(e);
    this.isExpired = true;
    this.onSessionExpire.execute();
    window.location.reload();
  }

  private async sessionExpiredInterceptor(request: Promise<any>): Promise<any> {
    try {
      return await request;
    } catch (exception: any) {
      const gqlError = errorOf(exception, GQLError);

      if (gqlError?.errorCode === EServerErrorCode.sessionExpired) {
        this.sessionExpired();
      }

      throw exception;
    }
  }
}

export type SessionExpireService = SessionExpireServiceImpl;

export class SessionExpireServiceDI extends Context.Service<SessionExpireServiceDI, SessionExpireServiceImpl>()(
  '@cloudbeaver/core-root/SessionExpireService#SessionExpireService',
) {
  static readonly implementation = SessionExpireServiceImpl;

  static readonly dependencies = () => [GraphQLService] as const;
  static readonly make: Effect.Effect<SessionExpireServiceImpl, never, Context.Service.Identifier<typeof GraphQLService>> = Effect.gen(
    function* makeSessionExpireService() {
      const graphQLService = yield* GraphQLService;

      return new SessionExpireServiceImpl(graphQLService);
    },
  );
  static readonly layer: Layer.Layer<SessionExpireServiceDI, never, Context.Service.Identifier<typeof GraphQLService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SessionExpireService = SessionExpireServiceDI;
