/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ClientActivityService } from '@cloudbeaver/core-client-activity';
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

export const SESSION_TOUCH_TIME_PERIOD = 1000 * 60;

interface SessionStateData {
  isValid?: boolean;
  remainingTime: number;
}

@injectable()
export class SessionResource extends CachedDataResource<SessionState | null> {
  private action: ISessionAction | null;
  private defaultLocale: string | undefined;
  readonly onStatusUpdate: ISyncExecutor<SessionStateData>;
  private touchSessionTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly graphQLService: GraphQLService,
    sessionInfoEventHandler: SessionInfoEventHandler,
    serverConfigResource: ServerConfigResource,
    private readonly clientActivityService: ClientActivityService,
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

    this.touchSession = this.touchSession.bind(this);
    this.processAction = this.processAction.bind(this);
    this.setDefaultLocale = this.setDefaultLocale.bind(this);
    this.changeLanguage = this.changeLanguage.bind(this);

    this.clientActivityService.onActiveStateChange.addHandler(this.touchSession);
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

  async touchSession() {
    if (!this.data?.valid || this.touchSessionTimer || !this.clientActivityService.isActive) {
      return;
    }

    const valid = await this.graphQLService.sdk.touchSession();

    if (!valid) {
      this.setData({
        ...this.data,
        valid,
      });
    }

    this.touchSessionTimer = setTimeout(() => {
      if (this.touchSessionTimer) {
        clearTimeout(this.touchSessionTimer);
        this.touchSessionTimer = null;
      }
    }, SESSION_TOUCH_TIME_PERIOD);

    return valid;
  }

  protected setData(data: SessionState | null) {
    if (!this.action) {
      this.action = data?.actionParameters;
    }

    super.setData(data);
  }
}
