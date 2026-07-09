/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConnectionTypeResource } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';

@injectable(() => [ConnectionTypeResource])
export class PluginBootstrap extends Bootstrap {
  constructor(private readonly connectionTypeResource: ConnectionTypeResource) {
    super();
  }

  override async load(): Promise<void> {
    await this.connectionTypeResource.load(CachedMapAllKey);
  }
}
