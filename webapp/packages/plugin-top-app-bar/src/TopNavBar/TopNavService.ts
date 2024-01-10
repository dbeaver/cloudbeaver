/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';

import { AppStateMenu } from './AppStateMenu/AppStateMenu';
import { Fill } from './Fill';
import { Logo } from './Logo';
import { MainMenu } from './MainMenu/MainMenu';

@injectable()
export class TopNavService {
  readonly placeholder = new PlaceholderContainer();

  constructor() {
    this.placeholder.add(Logo, 0);
    this.placeholder.add(MainMenu, 1);
    this.placeholder.add(Fill, 3);
    this.placeholder.add(AppStateMenu);
  }
}
