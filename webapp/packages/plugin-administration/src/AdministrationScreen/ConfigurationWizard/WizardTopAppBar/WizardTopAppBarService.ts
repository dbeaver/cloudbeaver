/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Fill, importLazyComponent, PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';

const ConfigurationWizardTitle = importLazyComponent(() => import('./ConfigurationWizardTitle.js').then(m => m.ConfigurationWizardTitle));

@injectable()
export class WizardTopAppBarService {
  readonly placeholder = new PlaceholderContainer();

  constructor() {
    this.placeholder.add(ConfigurationWizardTitle, 1);
    this.placeholder.add(Fill, 3);
  }
}
