/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { ClipboardService } from './ClipboardService.js';

@injectable()
export class ClipboardBootstrap extends Bootstrap {
  constructor(private readonly clipboardService: ClipboardService) {
    super();
  }

  override async load(): Promise<void> {
    await this.clipboardService.tryActivateClipboard();
  }
}
