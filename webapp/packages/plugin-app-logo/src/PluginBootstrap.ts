/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { TopNavService } from '@cloudbeaver/plugin-top-app-bar';
import { LogoLazy } from './LogoLazy.js';

@injectable()
export class AppLogoPluginBootstrap extends Bootstrap {
  constructor(private readonly topNavService: TopNavService) {
    super();
  }

  override register() {
    this.topNavService.placeholder.add(LogoLazy, 0);
  }
}
