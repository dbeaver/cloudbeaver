/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { CoreSettingsService } from '@cloudbeaver/core-app';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ExceptionsCatcherService } from '@cloudbeaver/core-events';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { DataPresentationService } from '@cloudbeaver/plugin-data-viewer';

import { SpreadsheetGrid } from './SpreadsheetGrid';

@injectable()
export class SpreadsheetService extends Bootstrap {
  constructor(
    private dataPresentationService: DataPresentationService,
    private coreSettingsService: CoreSettingsService,
    exceptionsCatcherService: ExceptionsCatcherService
  ) {
    super();
    exceptionsCatcherService.ignore('ResizeObserver loop limit exceeded'); // Produces by react-data-grid
  }

  register(): void | Promise<void> {
    const hidden = this.coreSettingsService.settings.getValue('app.reactDataGrid.hidden');
    if (hidden) {
      return;
    }

    this.dataPresentationService.add({
      id: 'spreadsheet_grid',
      dataFormat: ResultDataFormat.Resultset,
      getPresentationComponent: () => SpreadsheetGrid,
      title: 'Grid',
      icon: '/icons/grid.png',
    });
  }

  load(): void | Promise<void> { }
}
