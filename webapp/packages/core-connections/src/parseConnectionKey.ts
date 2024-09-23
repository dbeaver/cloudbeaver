/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { isResourceAlias, ResourceAliases, type ResourceKey, ResourceKeyUtils } from '@cloudbeaver/core-resource';
import { type ProjectInfo } from '@cloudbeaver/core-sdk';

import { type IConnectionInfoParams } from './CONNECTION_INFO_PARAM_SCHEMA.js';
import { ConnectionInfoActiveProjectKey, ConnectionInfoProjectKey } from './ConnectionInfoResource.js';

type Args = {
  originalKey: ResourceKey<IConnectionInfoParams>;
  aliases: ResourceAliases<IConnectionInfoParams>;
  isOutdated: (key: ResourceKey<IConnectionInfoParams>) => boolean;
  activeProjects: ProjectInfo[];
  refresh?: boolean;
};

export function parseConnectionKey({ originalKey, aliases, isOutdated, activeProjects, refresh }: Args) {
  const projectKey = aliases.isAlias(originalKey, ConnectionInfoProjectKey);
  let projectId: string | undefined;
  let projectIds: string[] | undefined;

  if (projectKey) {
    projectIds = projectKey.options.projectIds;
  }

  if (aliases.isAlias(originalKey, ConnectionInfoActiveProjectKey)) {
    projectIds = activeProjects.map(project => project.id);
  }

  if (isResourceAlias(originalKey)) {
    const key = aliases.transformToKey(originalKey);
    const outdated = ResourceKeyUtils.filter(key, key => isOutdated(key));

    if (!refresh && outdated.length === 1 && outdated[0]) {
      originalKey = outdated[0]; // load only single connection
    }
  }

  return { projectId, projectIds, key: originalKey };
}
