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

export const ROOT_NODE_PATH = 'ext://resources/cbadmin';

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

  async createResource(projectId: string, resourcePath: string, folder: boolean) {
    await this.graphQLService.sdk.createResource({
      projectId,
      resourcePath,
      isFolder: folder,
    });
  }

  async writeResource(data: string, projectId: string, resourcePath: string) {
    await this.graphQLService.sdk.writeResourceContent({
      data,
      projectId,
      resourcePath,
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