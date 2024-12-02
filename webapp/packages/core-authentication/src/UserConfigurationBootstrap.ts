/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { UserInfoResource } from './UserInfoResource.js';

@injectable()
export class UserConfigurationBootstrap extends Bootstrap {
  constructor(private readonly userInfoResource: UserInfoResource) {
    super();
  }

  override async load(): Promise<void> {
    await this.userInfoResource.load();
  }
}
