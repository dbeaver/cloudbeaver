/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AdministrationTopAppBarService } from '@cloudbeaver/core-administration';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { UserMenu } from '@cloudbeaver/plugin-user-profile';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly administrationTopAppBarService: AdministrationTopAppBarService
  ) {
    super();
  }

  register(): void {
    this.administrationTopAppBarService.placeholder.add(UserMenu, 4);
  }

  load(): void { }
}
