/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { GraphQLService, CachedMapResource, DataTransferProcessorInfo, resourceKeyList, CachedMapAllKey } from '@cloudbeaver/core-sdk';

@injectable()
export class DataTransferProcessorsResource extends CachedMapResource<string, DataTransferProcessorInfo> {
  constructor(
    private readonly graphQLService: GraphQLService,
    serverConfigResource: ServerConfigResource
  ) {
    super(() => new Map());
    this.sync(serverConfigResource, () => {}, () => CachedMapAllKey);
  }

  protected async loader(): Promise<Map<string, DataTransferProcessorInfo>> {
    const { processors } = await this.graphQLService.sdk.getDataTransferProcessors();

    this.replace(resourceKeyList(processors.map(processor => processor.id)), processors);

    return this.data;
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}
