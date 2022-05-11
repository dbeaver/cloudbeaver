/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import { NavNodeInfoResource } from '@cloudbeaver/core-app';
import { injectable } from '@cloudbeaver/core-di';

interface IResourceData {
  projectId: string;
  resourcePath: string;
}

@injectable()
export class ResourceManagerService {
  enabled = false;

  constructor(
    private readonly navNodeResource: NavNodeInfoResource
  ) {
    this.toggleEnabled = this.toggleEnabled.bind(this);

    makeObservable(this, {
      enabled: observable.ref,
    });
  }

  toggleEnabled() {
    this.enabled = !this.enabled;
  }

  async getResourceData(nodeId: string, parents: string[]): Promise<IResourceData> {
    const workspace = parents[1];
    const workspaceNode = await this.navNodeResource.load(workspace);
    const resourcePath = nodeId.substring(workspace.length).slice(1);

    return {
      projectId: workspaceNode.name ?? '',
      resourcePath,
    };
  }
}