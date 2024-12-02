/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { ExecutorInterrupter } from '@cloudbeaver/core-executor';
import { CachedResource } from '@cloudbeaver/core-resource';

import { ServerConfigResource } from './ServerConfigResource.js';
import { ServerLicenseStatusResource } from './ServerLicenseStatusResource.js';
import { SessionPermissionsResource } from './SessionPermissionsResource.js';

export enum EPermission {}

@injectable()
export class PermissionsService {
  get publicDisabled(): boolean {
    return (
      this.serverConfigResource.configurationMode ||
      (this.serverLicenseStatusResource?.licenseRequired && !this.serverLicenseStatusResource.licenseValid)
    );
  }

  constructor(
    private readonly permissions: SessionPermissionsResource,
    private readonly serverConfigResource: ServerConfigResource,
    private readonly serverLicenseStatusResource: ServerLicenseStatusResource,
  ) {}

  requirePublic<T>(resource: CachedResource<any, any, T, any, any>, map?: (param: void) => T): this {
    resource.preloadResource(this.serverLicenseStatusResource, () => {}).before(ExecutorInterrupter.interrupter(() => this.publicDisabled));

    this.serverLicenseStatusResource.outdateResource<T>(resource, map as any);

    return this;
  }

  has(id: string): boolean {
    return this.permissions.has(id);
  }

  async hasAsync(id: string): Promise<boolean> {
    return this.permissions.hasAsync(id);
  }

  async update(): Promise<void> {
    await this.permissions.refresh();
  }
}
