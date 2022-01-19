/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { VersionUpdateService } from '@cloudbeaver/core-version-update';

import { UpdateInstruction } from './UpdateInstruction';

@injectable()
export class ProductBootstrap extends Bootstrap {
  constructor(
    private readonly versionUpdateService: VersionUpdateService
  ) {
    super();
  }

  async load() { }

  register() {
    this.versionUpdateService.registerInstruction(
      () => UpdateInstruction
    );
  }
}
