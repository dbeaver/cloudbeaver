/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { ClipboardService } from './ClipboardService';

@injectable()
export class ClipboardBootstrap extends Bootstrap {
  constructor(
    private readonly clipboardService: ClipboardService,
  ) {
    super();
  }

  register(): void { }

  async load(): Promise<void> {
    await this.clipboardService.tryActivateClipboard();
  }
}
