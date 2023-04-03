/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';

import { SessionPermissionsResource } from './SessionPermissionsResource';

export enum EPermission {
}

@injectable()
export class PermissionsService {
  constructor(
    private readonly permissions: SessionPermissionsResource
  ) {
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
