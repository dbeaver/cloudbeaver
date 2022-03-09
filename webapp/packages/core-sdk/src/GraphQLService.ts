/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';

import { CustomGraphQLClient } from './CustomGraphQLClient';
import { EnvironmentService } from './EnvironmentService';
import type { IResponseInterceptor } from './IResponseInterceptor';
import { getSdk } from './sdk';

@injectable()
export class GraphQLService {
  sdk: ReturnType<typeof getSdk>;

  readonly client: CustomGraphQLClient;

  constructor(private readonly environmentService: EnvironmentService) {
    const gqlEndpoint = this.environmentService.gqlEndpoint;
    this.client = new CustomGraphQLClient(gqlEndpoint);
    this.sdk = getSdk(this.client as any);
  }

  registerInterceptor(interceptor: IResponseInterceptor): void {
    this.client.registerInterceptor(interceptor);
  }

  enableRequests(): void {
    this.client.enableRequests();
  }

  blockRequests(reason: Error | string): void {
    this.client.blockRequests(reason);
  }
}
