/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { TopNavService } from '@cloudbeaver/core-app';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { UserMenu } from './UserMenu/UserMenu';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly topNavService: TopNavService
  ) {
    super();
  }

  register(): void {
    this.topNavService.placeholder.add(UserMenu, 5);
  }

  load(): void { }
}
