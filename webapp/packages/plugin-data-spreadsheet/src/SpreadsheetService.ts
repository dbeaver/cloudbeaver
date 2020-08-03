/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { DataPresentationService } from '@cloudbeaver/plugin-data-viewer';

import { Spreadsheet } from './Spreadsheet';

@injectable()
export class SpreadsheetService extends Bootstrap {
  constructor(private dataPresentationService: DataPresentationService) {
    super();
  }

  register(): void | Promise<void> {
    this.dataPresentationService.add({
      component: Spreadsheet,
    });
  }

  load(): void | Promise<void> { }
}
