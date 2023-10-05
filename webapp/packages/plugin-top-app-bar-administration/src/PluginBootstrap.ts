/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { AdministrationTopAppBarService } from '@cloudbeaver/plugin-administration';

import { AdminTopNavBar } from './TopNavBar/AdminTopNavBar';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(private readonly administrationTopAppBarService: AdministrationTopAppBarService) {
    super();
  }

  register(): void | Promise<void> {
    this.administrationTopAppBarService.navBarPlaceholder.add(AdminTopNavBar);
  }

  load(): void | Promise<void> {}
}
