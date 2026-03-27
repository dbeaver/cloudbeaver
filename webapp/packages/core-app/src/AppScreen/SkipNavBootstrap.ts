/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { AppScreenService } from './AppScreenService.js';
import { SkipNavLinks } from './SkipNavLinks.js';

@injectable(() => [AppScreenService])
export class SkipNavBootstrap extends Bootstrap {
  constructor(private readonly appScreenService: AppScreenService) {
    super();
  }

  override register(): void {
    this.appScreenService.placeholder.add(SkipNavLinks, 0);
  }
}
