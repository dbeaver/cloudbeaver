/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { GraphQLService, CachedDataResource, DataTransferProcessorInfo } from '@cloudbeaver/core-sdk';

@injectable()
export class DataTransferProcessorsResource extends CachedDataResource<Map<string, DataTransferProcessorInfo>, void> {
  constructor(
    private graphQLService: GraphQLService
  ) {
    super(new Map());
  }

  protected async loader(): Promise<Map<string, DataTransferProcessorInfo>> {
    const { processors } = await this.graphQLService.sdk.getDataTransferProcessors();

    this.data.clear();

    for (const processor of processors) {
      this.data.set(processor.id, processor);
    }

    return this.data;
  }
}
