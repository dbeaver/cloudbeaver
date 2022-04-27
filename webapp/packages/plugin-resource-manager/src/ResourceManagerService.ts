/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { GraphQLService } from '@cloudbeaver/core-sdk';

export const ROOT_NODE_PATH = 'ext://resources';
export const RESOURCE_MANAGER_NODE_TYPE = 'rm.resource';

@injectable()
export class ResourceManagerService {
  enabled = false;

  constructor(private readonly graphQLService: GraphQLService) {
    this.toggleEnabled = this.toggleEnabled.bind(this);

    makeObservable(this, {
      enabled: observable.ref,
    });
  }

  toggleEnabled() {
    this.enabled = !this.enabled;
  }

  getResourceName(resourceId: string) {
    const parts = resourceId.replace('//', '\\').split('/');
    return parts[parts.length - 1];
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
}