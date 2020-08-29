/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AdministrationTopAppBarService, WizardTopAppBarService } from '@cloudbeaver/core-administration';
import { injectable, Bootstrap } from '@cloudbeaver/core-di';

import { Logo } from './Logo';
import { SettingsMenu } from './SettingsMenu/SettingsMenu';

@injectable()
export class AdministrationTopAppBarBootstrapService extends Bootstrap {

  constructor(
    private administrationTopAppBarService: AdministrationTopAppBarService,
    private wizardTopAppBarService: WizardTopAppBarService
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.administrationTopAppBarService.placeholder.add(Logo, 0);
    this.administrationTopAppBarService.placeholder.add(SettingsMenu, 4);
    this.wizardTopAppBarService.placeholder.add(Logo, 0);
  }

  load(): void | Promise<void> {}
}
