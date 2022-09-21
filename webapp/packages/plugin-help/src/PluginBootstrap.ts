/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { TopNavService } from '@cloudbeaver/plugin-top-app-bar';

import { Help } from './Help';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly topNavService: TopNavService
  ) {
    super();
  }

  async load(): Promise<void> { }

  register(): void {
    this.topNavService.placeholder.add(Help, 5);
  }
}
