/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
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

@injectable()
export class SessionResource extends CachedDataResource<SessionState | null> {
  private action: ISessionAction | null;
  private defaultLocale: string | undefined;
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

  //! this method results in onDataUpdate handler skipping
  async refreshSilent(): Promise<void> {
    const session = await this.loader();

    this.setData(session);
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

  protected setData(data: SessionState | null) {
    if (!this.action) {
      this.action = data?.actionParameters;
    }

    super.setData(data);
  }
}
