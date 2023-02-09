/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ResourceManagerResource } from '@cloudbeaver/core-resource-manager';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { CachedResourceParamKey } from '@cloudbeaver/core-sdk';

import { ResourceManagerService } from './ResourceManagerService';

@injectable()
export class PluginBootstrap extends Bootstrap {
  private subscriptionKey: string | null;

  constructor(
    private readonly resourceManagerResource: ResourceManagerResource,
    private readonly resourceManagerService: ResourceManagerService,
    private readonly serverConfigResource: ServerConfigResource
  ) {
    super();

    this.subscriptionKey = null;
  }

  register(): void | Promise<void> {
    this.serverConfigResource.onDataUpdate.addHandler(this.subscriptionHandler.bind(this));
  }

  async load(): Promise<void> {
    this.subscriptionHandler();
  }

  private subscriptionHandler() {
    if (this.resourceManagerService.enabled) {
      this.subscriptionKey = this.resourceManagerResource.use(CachedResourceParamKey);
    } else {
      if (this.subscriptionKey) {
        this.resourceManagerResource.free(CachedResourceParamKey, this.subscriptionKey);
        this.subscriptionKey = null;
      }
    }
  }
}