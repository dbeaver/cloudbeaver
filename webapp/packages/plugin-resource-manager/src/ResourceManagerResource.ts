/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { CachedMapResource, GraphQLService, RmResource } from '@cloudbeaver/core-sdk';

@injectable()
export class ResourceManagerResource extends CachedMapResource<string, RmResource[]> {
  constructor(
    private readonly graphQLService: GraphQLService
  ) {
    super();
  }

  async createResource(projectId: string, resourcePath: string, folder: boolean) {
    await this.graphQLService.sdk.createResource({
      projectId,
      resourcePath,
      isFolder: folder,
    });
  }

  async writeResource(projectId: string, resourcePath: string, data: string) {
    await this.graphQLService.sdk.writeResourceContent({
      projectId,
      resourcePath,
      data,
    });
  }

  async readResource(projectId: string, resourcePath: string) {
    const result = await this.graphQLService.sdk.readResource({
      projectId,
      resourcePath,
    });

    return result.value;
  }

  async deleteResource(projectId: string, resourcePath: string) {
    await this.graphQLService.sdk.deleteResource({
      projectId,
      resourcePath,
      recursive: false,
    });
  }

  protected async loader(key: string): Promise<Map<string, RmResource[]>> {
    const { resources } = await this.graphQLService.sdk.getResourceList({
      projectId: key,
    });

    this.dataSet(key, resources);
    return this.data;
  }
}