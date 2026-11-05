/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { WizardTopAppBarService } from '@cloudbeaver/plugin-administration';

const LanguageSelector = importLazyComponent(() => import('./LanguageSelector.js').then(module => module.LanguageSelector));

@injectable(() => [WizardTopAppBarService])
export class LocalizationAdministrationPluginBootstrap extends Bootstrap {
  constructor(private readonly wizardTopAppBarService: WizardTopAppBarService) {
    super();
  }

  override register(): void {
    this.wizardTopAppBarService.placeholder.add(LanguageSelector, 4);
  }
}
