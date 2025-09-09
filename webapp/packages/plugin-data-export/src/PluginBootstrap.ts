/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { DataExportMenuService } from './DataExportMenuService.js';

@injectable(() => [DataExportMenuService])
export class PluginBootstrap extends Bootstrap {
  constructor(private readonly dataExportMenuService: DataExportMenuService) {
    super();
  }

  override register(): void {
    this.dataExportMenuService.register();
  }
}
