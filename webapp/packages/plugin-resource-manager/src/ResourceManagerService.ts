/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable } from 'mobx';

import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import type { ProjectInfo } from '@cloudbeaver/core-projects';
import { ServerConfigResource } from '@cloudbeaver/core-root';

@injectable()
export class ResourceManagerService {
  get enabled() {
    return !!this.serverConfigResource.data?.resourceManagerEnabled && this.userInfoResource.isAuthenticated();
  }

  constructor(
    private readonly userInfoResource: UserInfoResource,
    private readonly serverConfigResource: ServerConfigResource,
  ) {
    makeObservable(this, {
      enabled: computed,
    });
  }

  getRootFolder(project: ProjectInfo, resourceTypeId: string): string | undefined {
    const scriptType = project.resourceTypes.find(type => type.id === resourceTypeId);

    return this.serverConfigResource.distributed ? scriptType?.rootFolder : undefined;
  }
}
