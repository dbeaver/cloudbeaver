/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';

import { PermissionsResource } from './PermissionsResource';

export enum EPermission {
  public = 'public'
}

@injectable()
export class PermissionsService {
  constructor(
    private permissions: PermissionsResource
  ) {
  }

  has(id: string): boolean {
    return this.permissions.has(id);
  }

  async hasAsync(id: string): Promise<boolean> {
    await this.permissions.load();
    return this.has(id);
  }

  async update(): Promise<void> {
    await this.permissions.refresh();
  }
}
