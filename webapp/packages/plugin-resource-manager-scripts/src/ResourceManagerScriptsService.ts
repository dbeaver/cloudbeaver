/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { createPath } from '@cloudbeaver/core-utils';
import { ResourceProjectsResource, RESOURCES_NODE_PATH } from '@cloudbeaver/plugin-resource-manager';

import { SCRIPTS_TYPE_ID } from './SCRIPTS_TYPE_ID';

@injectable()
export class ResourceManagerScriptsService {
  constructor(
    private readonly resourceProjectsResource: ResourceProjectsResource,
    private readonly serverConfigResource: ServerConfigResource,
  ) { }

  getRootFolder(projectId: string) {
    const project = this.resourceProjectsResource.data.find(project => project.id === projectId);

    if (!project) {
      return;
    }

    const scriptType = project.resourceTypes.find(type => type.id === SCRIPTS_TYPE_ID);
    return scriptType?.rootFolder;
  }

  getRootPath(projectId: string) {
    return createPath(
      RESOURCES_NODE_PATH,
      projectId,
      this.serverConfigResource.data?.distributed ? this.getRootFolder(projectId) : undefined
    );
  }
}