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
import { SessionInfoEventHandler } from './SessionInfoEventHandler';

export type SessionState = SessionStateFragment;
export interface ISessionAction {
  action: string;
  [key: string]: any;
}

interface SessionStateData {
  isValid?: boolean;
  remainingTime: number;
}

export const SESSION_TOUCH_TIME_PERIOD = 1000 * 60;

@injectable()
export class SessionResource extends CachedDataResource<SessionState | null> {
  private action: ISessionAction | null;
  private defaultLocale: string | undefined;
  private touchSessionTimer: NodeJS.Timeout | null;
  readonly onStatusUpdate: ISyncExecutor<SessionStateData>;

  constructor(
    private readonly graphQLService: GraphQLService,
    sessionInfoEventHandler: SessionInfoEventHandler,
    serverConfigResource: ServerConfigResource,
  ) {
    super(() => null);

    this.onStatusUpdate = new SyncExecutor();
    sessionInfoEventHandler.onEvent(
      ServerEventId.CbSessionState,
      event => {
        this.onStatusUpdate.execute(event);
      },
      undefined,
      this,
    );

    this.touchSessionTimer = null;
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

  touchSession = () => {
    if (this.touchSessionTimer) {
      return;
    }

    if (this.data?.valid) {
      this.graphQLService.sdk.touchSession();
    }

    this.touchSessionTimer = setTimeout(() => {
      if (this.touchSessionTimer) {
        clearTimeout(this.touchSessionTimer);
        this.touchSessionTimer = null;
      }
    }, SESSION_TOUCH_TIME_PERIOD);
  };

  protected setData(data: SessionState | null) {
    if (!this.action) {
      this.action = data?.actionParameters;
    }

    super.setData(data);
  }
}
