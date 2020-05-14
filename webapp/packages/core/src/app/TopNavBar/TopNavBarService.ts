/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@dbeaver/core/di';
import { PlaceholderContainer } from '@dbeaver/core/placeholder';

import { ConnectionSelector } from './ConnectionSchemaManager/ConnectionSelector/ConnectionSelector';
import { Fill } from './Fill';
import { Logo } from './Logo';
import { MainMenu } from './MainMenu/MainMenu';
import { MainRightMenu } from './MainRightMenu/MainRightMenu';

@injectable()
export class TopNavService {
  readonly placeholder = new PlaceholderContainer();

  constructor() {
    this.placeholder.add(Logo, 0);
    this.placeholder.add(MainMenu, 1);
    this.placeholder.add(ConnectionSelector, 2);
    this.placeholder.add(Fill, 3);
    this.placeholder.add(MainRightMenu, 4);
  }
}
