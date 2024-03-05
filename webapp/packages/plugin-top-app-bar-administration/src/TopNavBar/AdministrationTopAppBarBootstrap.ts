/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { AdministrationTopAppBarService, WizardTopAppBarService } from '@cloudbeaver/plugin-administration';
import { Logo } from '@cloudbeaver/plugin-top-app-bar';

@injectable()
export class AdministrationTopAppBarBootstrap extends Bootstrap {
  constructor(
    private readonly administrationTopAppBarService: AdministrationTopAppBarService,
    private readonly wizardTopAppBarService: WizardTopAppBarService,
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.administrationTopAppBarService.placeholder.add(Logo, 0);
    this.wizardTopAppBarService.placeholder.add(Logo, 0);
  }

  load(): void | Promise<void> {}
}
