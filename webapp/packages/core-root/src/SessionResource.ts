/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { GraphQLService, type SessionStateFragment } from '@cloudbeaver/core-sdk';

import { ServerConfigResource } from './ServerConfigResource.js';
import { ServerEventId, SessionEventSource } from './SessionEventSource.js';
import { type ISessionStateEvent, SessionInfoEventHandler } from './SessionInfoEventHandler.js';

export type SessionState = SessionStateFragment;

export interface ISessionAction {
  action: string;
  [key: string]: any;
}

export class SessionResourceImpl extends CachedDataResource<SessionState | null> {
  private action: ISessionAction | null;

  constructor(
    private readonly graphQLService: GraphQLService,
    sessionEventSource: SessionEventSource,
    private readonly sessionInfoEventHandler: SessionInfoEventHandler,
    serverConfigResource: ServerConfigResource,
    private readonly localizationService: LocalizationService,
  ) {
    super(() => null);

    this.handleSessionStateEvent = this.handleSessionStateEvent.bind(this);

    sessionEventSource.onActivate.addHandler(() => this.load());
    sessionInfoEventHandler.onEvent(ServerEventId.CbSessionState, this.handleSessionStateEvent, undefined, this);

    this.action = null;
    this.sync(
      serverConfigResource,
      () => {},
      () => {},
    );
  }

  processAction(): ISessionAction | null {
    try {
      return this.action;
    } finally {
      this.action = null;
    }
  }

  private handleSessionStateEvent(event: ISessionStateEvent) {
    this.performUpdate(undefined, [], async () => {
      if (!this.data) {
        return;
      }

      const sessionState: SessionState = {
        ...this.data,
        valid: event?.isValid ?? this.data.valid,
        remainingTime: event.remainingTime,
        actionParameters: event.actionParameters,
        cacheExpired: event?.isCacheExpired ?? this.data.cacheExpired,
        lastAccessTime: String(event.lastAccessTime),
        locale: event.locale,
      };

      this.setData(sessionState);
    });
  }

  async changeLanguage(locale: string): Promise<void> {
    await this.load();

    this.performUpdate(undefined, [], async () => {
      if (this.data?.locale === locale) {
        return;
      }

      await this.graphQLService.sdk.changeSessionLanguage({ locale });

      if (this.data) {
        this.data.locale = locale;
      }
    });

    this.markOutdated();
  }

  protected async loader(): Promise<SessionState> {
    const { session } = await this.graphQLService.sdk.openSession({ defaultLocale: this.localizationService.currentLanguage });

    return session;
  }

  pingSession() {
    if (!this.data?.valid) {
      return;
    }

    this.sessionInfoEventHandler.pingSession();
  }

  protected override setData(data: SessionState | null) {
    if (!this.action) {
      this.action = data?.actionParameters;
    }

    super.setData(data);
  }
}

export type SessionResource = SessionResourceImpl;

export class SessionResourceDI extends Context.Service<SessionResourceDI, SessionResourceImpl>()(
  '@cloudbeaver/core-root/SessionResource#SessionResource',
) {
  static readonly implementation = SessionResourceImpl;

  static readonly dependencies = () =>
    [GraphQLService, SessionEventSource, SessionInfoEventHandler, ServerConfigResource, LocalizationService] as const;
  static readonly make: Effect.Effect<
    SessionResourceImpl,
    never,
    | Context.Service.Identifier<typeof GraphQLService>
    | Context.Service.Identifier<typeof SessionEventSource>
    | Context.Service.Identifier<typeof SessionInfoEventHandler>
    | Context.Service.Identifier<typeof ServerConfigResource>
    | Context.Service.Identifier<typeof LocalizationService>
  > = Effect.gen(function* makeSessionResource() {
    const graphQLService = yield* GraphQLService;
    const sessionEventSource = yield* SessionEventSource;
    const sessionInfoEventHandler = yield* SessionInfoEventHandler;
    const serverConfigResource = yield* ServerConfigResource;
    const localizationService = yield* LocalizationService;

    return new SessionResourceImpl(graphQLService, sessionEventSource, sessionInfoEventHandler, serverConfigResource, localizationService);
  });
  static readonly layer: Layer.Layer<
    SessionResourceDI,
    never,
    | Context.Service.Identifier<typeof GraphQLService>
    | Context.Service.Identifier<typeof SessionEventSource>
    | Context.Service.Identifier<typeof SessionInfoEventHandler>
    | Context.Service.Identifier<typeof ServerConfigResource>
    | Context.Service.Identifier<typeof LocalizationService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SessionResource = SessionResourceDI;
