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
  constructor(
    private graphQLService: GraphQLService,
    private serverConfiguration: ServerConfigResource
  ) {
    super(null);

    this.serverConfiguration.onDataOutdated.addHandler(this.markOutdated.bind(this));
    this.serverConfiguration.onDataUpdate.addHandler(() => { this.load(); });
  }

  async update(): Promise<void> {
    await this.refresh();
  }

  protected async loader(): Promise<SessionState> {
    await this.serverConfiguration.load();

    const { session } = await this.graphQLService.sdk.openSession();

    return session;
  }
}
