/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { DataViewerTabService } from './DataViewerTabService.js';
import { ResultSetTableFooterMenuService } from './ResultSet/ResultSetTableFooterMenuService.js';
import { TableFooterMenuService } from './TableViewer/TableFooter/TableFooterMenu/TableFooterMenuService.js';

@injectable()
export class DataViewerBootstrap extends Bootstrap {
  constructor(
    private readonly dataViewerTabService: DataViewerTabService,
    private readonly tableFooterMenuService: TableFooterMenuService,
    private readonly resultSetTableFooterMenuService: ResultSetTableFooterMenuService,
  ) {
    super();
  }

  override register(): void | Promise<void> {
    this.dataViewerTabService.registerTabHandler();
    this.dataViewerTabService.register();
    this.tableFooterMenuService.register();
    this.resultSetTableFooterMenuService.register();
  }
}
