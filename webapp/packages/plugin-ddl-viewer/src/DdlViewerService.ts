/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { GraphQLService } from '@cloudbeaver/core-sdk';

@injectable()
export class DdlViewerService {
  private ddlMetadata = new Map<string, Promise<string>>();

  constructor(private graphQLService: GraphQLService) {
    makeObservable<DdlViewerService, 'ddlMetadata'>(this, {
      ddlMetadata: observable,
    });
  }

  getMetadata(nodeId: string) {
    return this.ddlMetadata.get(nodeId);
  }

  async loadDdlMetadata(nodeId: string): Promise<string> {
    const cached = this.ddlMetadata.get(nodeId);
    if (cached) {
      return cached;
    }
    const metadata = this.fetchDdlMetadata(nodeId);
    this.ddlMetadata.set(nodeId, metadata);
    return metadata;
  }

  resetMetadata(nodeId: string): void {
    this.ddlMetadata.delete(nodeId);
  }

  private async fetchDdlMetadata(nodeId: string): Promise<string> {
    const response = await this.graphQLService.sdk.metadataGetNodeDDL({ nodeId });
    return response.metadataGetNodeDDL || '';
  }
}
