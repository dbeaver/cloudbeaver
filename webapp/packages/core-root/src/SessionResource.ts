/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import {
  GraphQLService,
  CachedDataResource,
  SessionStateFragment
} from '@cloudbeaver/core-sdk';

import { ServerConfigResource } from './ServerConfigResource';

export type SessionState = SessionStateFragment;
export interface ISessionAction {
  action: string;
  [key: string]: any;
}

@injectable()
export class SessionResource extends CachedDataResource<SessionState | null> {
  private action: ISessionAction | null;
  private defaultLocale: string | undefined;

  constructor(
    private readonly graphQLService: GraphQLService,
    serverConfigResource: ServerConfigResource
  ) {
    super(null);

    this.action = null;
    this.sync(serverConfigResource, () => {}, () => {});
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
    await this.performUpdate(undefined, undefined, async () => {
      await this.graphQLService.sdk.changeSessionLanguage({ locale });

      this.defaultLocale = locale;
      if (this.data) {
        this.data.locale = locale;
      }
    });
  }

  protected async loader(): Promise<SessionState> {
    const { session } = await this.graphQLService.sdk.openSession({ defaultLocale: this.defaultLocale });

    return session;
  }

  protected setData(data: SessionState | null) {
    if (!this.action) {
      this.action = data?.actionParameters;
    }

    this.data = data;
  }
}
