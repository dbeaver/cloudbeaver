/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
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

@injectable()
export class SessionResource extends CachedDataResource<SessionState | null, void> {
  private defaultLocale: string | undefined;
  constructor(
    private graphQLService: GraphQLService,
    serverConfigResource: ServerConfigResource
  ) {
    super(null);

    this.sync(serverConfigResource);
  }

  setDefaultLocale(defaultLocale?: string): void {
    this.defaultLocale = defaultLocale;
  }

  async refreshSilent(): Promise<void> {
    const { session } = await this.graphQLService.sdk.openSession({ defaultLocale: this.defaultLocale });

    this.data = session;
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
}
