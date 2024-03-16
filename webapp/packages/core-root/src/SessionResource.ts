/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { GraphQLService, SessionStateFragment } from '@cloudbeaver/core-sdk';

import { ServerConfigResource } from './ServerConfigResource';
import { ServerEventId } from './SessionEventSource';
import { type ISessionStateEvent, SessionInfoEventHandler } from './SessionInfoEventHandler';

export type SessionState = SessionStateFragment;
export interface ISessionAction {
  action: string;
  [key: string]: any;
}

@injectable()
export class SessionResource extends CachedDataResource<SessionState | null> {
  private action: ISessionAction | null;
  private defaultLocale: string | undefined;
  readonly onStatusUpdate: ISyncExecutor<SessionState>;

  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly sessionInfoEventHandler: SessionInfoEventHandler,
    serverConfigResource: ServerConfigResource,
  ) {
    super(() => null);

    this.handleSessionStateEvent = this.handleSessionStateEvent.bind(this);

    this.onStatusUpdate = new SyncExecutor();
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

  setDefaultLocale(defaultLocale?: string): void {
    this.defaultLocale = defaultLocale;
  }

  private handleSessionStateEvent(event: ISessionStateEvent) {
    if (!this.data) {
      return;
    }

    const sessionState: SessionState = {
      ...this.data,
      valid: event?.isValid ?? this.data?.valid,
      remainingTime: event.remainingTime,
      actionParameters: event.actionParameters,
      cacheExpired: event?.isCacheExpired ?? this.data.cacheExpired,
      lastAccessTime: String(event.lastAccessTime),
      locale: event.locale,
    };

    this.setData(sessionState);
    this.onStatusUpdate.execute(sessionState);
  }

  async changeLanguage(locale: string): Promise<void> {
    if (this.data?.locale === locale) {
      return;
    }
    await this.graphQLService.sdk.changeSessionLanguage({ locale });

    this.defaultLocale = locale;
    if (this.data) {
      this.data.locale = locale;
    }

    this.markOutdated();
  }

  protected async loader(): Promise<SessionState> {
    const { session } = await this.graphQLService.sdk.openSession({ defaultLocale: this.defaultLocale });

    return session;
  }

  updateSession() {
    if (!this.data?.valid) {
      return;
    }

    this.sessionInfoEventHandler.updateSession();
  }

  protected setData(data: SessionState | null) {
    if (!this.action) {
      this.action = data?.actionParameters;
    }

    super.setData(data);
  }
}
