/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent, PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';

import { AppScreenService } from './AppScreenService.js';

const SkipNavLinks = importLazyComponent(() => import('./SkipNavLinks.js').then(m => m.SkipNavLinks));

@injectable(() => [AppScreenService])
export class SkipNavService {
  readonly extraLinks: PlaceholderContainer;

  constructor(private readonly appScreenService: AppScreenService) {
    this.extraLinks = new PlaceholderContainer();
  }

  registerLinks(): void {
    this.appScreenService.placeholder.add(SkipNavLinks, 0);
  }
}
