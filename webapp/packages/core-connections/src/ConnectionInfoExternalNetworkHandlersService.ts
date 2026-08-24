/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';

import type { IConnectionInfoParams } from './CONNECTION_INFO_PARAM_SCHEMA.js';

export type ConnectionInfoExternalNetworkHandlersProvider = (key: IConnectionInfoParams) => Promise<readonly string[]>;

@injectable()
export class ConnectionInfoExternalNetworkHandlersService {
  private readonly providerRegistry = new Map<string, ConnectionInfoExternalNetworkHandlersProvider>();

  registerProvider(providerId: string, provider: ConnectionInfoExternalNetworkHandlersProvider): void {
    this.providerRegistry.set(providerId, provider);
  }

  async getProvidedHandlers(connectionKey: IConnectionInfoParams): Promise<readonly string[]> {
    return [...new Set((await Promise.all([...this.providerRegistry.values()].map(provider => provider(connectionKey)))).flat())];
  }
}
