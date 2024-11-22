/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { AdministrationTopAppBarService, WizardTopAppBarService } from '@cloudbeaver/plugin-administration';
import { LogoLazy } from '@cloudbeaver/plugin-app-logo';

@injectable()
export class AppLogoAdministrationPluginBootstrap extends Bootstrap {
  constructor(
    private readonly administrationTopAppBarService: AdministrationTopAppBarService,
    private readonly wizardTopAppBarService: WizardTopAppBarService,
  ) {
    super();
  }

  override register() {
    this.administrationTopAppBarService.placeholder.add(LogoLazy, 0);
    this.wizardTopAppBarService.placeholder.add(LogoLazy, 0);
  }
}
