/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';

@injectable()
export class AppScreenService {
  readonly placeholder: PlaceholderContainer;

  constructor() {
    this.placeholder = new PlaceholderContainer();
  }
}
