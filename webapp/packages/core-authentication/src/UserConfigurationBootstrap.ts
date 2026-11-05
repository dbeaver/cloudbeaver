/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { UserConfigurationService } from './UserConfiguration/UserConfigurationService.js';
import { UserInfoResource } from './UserInfoResource.js';

@injectable(() => [UserInfoResource, UserConfigurationService])
export class UserConfigurationBootstrap extends Bootstrap {
  constructor(
    private readonly userInfoResource: UserInfoResource,
    private readonly userConfigurationService: UserConfigurationService,
  ) {
    super();
  }

  override register(): void {
    this.userConfigurationService.register();
  }

  override async load(): Promise<void> {
    await this.userInfoResource.load();
  }
}
