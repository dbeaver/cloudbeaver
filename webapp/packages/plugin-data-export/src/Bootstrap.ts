/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap as B, injectable } from '@cloudbeaver/core-di';

import { DataExportMenuService } from './DataExportMenuService';

@injectable()
export class Bootstrap extends B {
  constructor(private dataExportMenuService: DataExportMenuService) {
    super();
  }

  register(): void {
    this.dataExportMenuService.register();
  }

  load(): void {}
}
