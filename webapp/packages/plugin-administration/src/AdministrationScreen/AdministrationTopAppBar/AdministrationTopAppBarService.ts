/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';

import { Fill } from './Fill';

@injectable()
export class AdministrationTopAppBarService {
  readonly placeholder = new PlaceholderContainer();

  constructor() {
    this.placeholder.add(Fill, 3);
  }
}
