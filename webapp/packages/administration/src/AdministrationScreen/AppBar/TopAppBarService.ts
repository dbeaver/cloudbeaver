/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { SettingsMenu, Logo } from '@dbeaver/core/app';
import { PlaceholderContainer } from '@dbeaver/core/blocks';
import { injectable } from '@dbeaver/core/di';

import { Fill } from './Fill';

@injectable()
export class TopAppBarService {
  readonly placeholder = new PlaceholderContainer();

  constructor() {
    this.placeholder.add(Logo, 0);
    this.placeholder.add(Fill, 3);
    this.placeholder.add(SettingsMenu, 4);
  }
}
