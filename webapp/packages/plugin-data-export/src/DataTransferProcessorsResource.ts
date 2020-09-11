/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { GraphQLService, CachedDataResource, DataTransferProcessorInfo } from '@cloudbeaver/core-sdk';

@injectable()
export class DataTransferProcessorsResource extends CachedDataResource<Map<string, DataTransferProcessorInfo>, null> {
  @observable private loaded = false;

  constructor(
    private graphQLService: GraphQLService,
  ) {
    super(new Map());
  }

  isLoaded() {
    return this.loaded;
  }

  protected async loader(key: null) {
    const { processors } = await this.graphQLService.sdk.getDataTransferProcessors();

    this.data.clear();

    for (const processor of processors) {
      this.data.set(processor.id, processor);
    }
    this.loaded = true;
    this.markUpdated(key);

    return this.data;
  }
}
