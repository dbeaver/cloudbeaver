/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { VersionUpdateService } from '@cloudbeaver/core-version-update';

const UpdateInstruction = importLazyComponent(() => import('./UpdateInstruction.js').then(m => m.UpdateInstruction));

@injectable()
export class ProductBootstrap extends Bootstrap {
  constructor(private readonly versionUpdateService: VersionUpdateService) {
    super();
  }

  override register() {
    this.versionUpdateService.registerVersionInstruction(() => UpdateInstruction);
  }
}
