/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AppScreenService } from '@cloudbeaver/core-app';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { TopNavBar } from './TopNavBar/TopNavBar';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly appScreenService: AppScreenService,
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.appScreenService.placeholder.add(TopNavBar);
  }

  load(): void | Promise<void> { }
}