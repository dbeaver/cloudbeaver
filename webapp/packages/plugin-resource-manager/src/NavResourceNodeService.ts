/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { ResourceManagerResource } from '@cloudbeaver/core-resource-manager';

import { getResourceNodeId } from './NavNodes/getResourceNodeId';

@injectable()
export class NavResourceNodeService {
  constructor(
    private readonly resourceManagerResource: ResourceManagerResource,
  ) { }

  async move(key: string, newKey: string): Promise<string> {
    await this.resourceManagerResource.move(key, newKey);

    return getResourceNodeId(newKey);
  }

  async delete(key: string) {
    await this.resourceManagerResource.deleteResource(key);
  }

  async read(key: string): Promise<string> {
    return await this.resourceManagerResource.readText(key);
  }

  async write(key: string, value: string) {
    await this.resourceManagerResource.writeText(
      key,
      value,
      true
    );
  }

  async setProperties(key: string, diff: Record<string, any>): Promise<Record<string, any>> {
    return await this.resourceManagerResource.setProperties(
      key,
      diff
    );
  }
}