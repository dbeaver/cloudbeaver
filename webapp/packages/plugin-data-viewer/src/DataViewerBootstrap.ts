/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { DataViewerTabService } from './DataViewerTabService';

@injectable()
export class DataViewerBootstrap extends Bootstrap {
  constructor(private dataViewerTabService: DataViewerTabService) {
    super();
  }

  register(): void | Promise<void> {
    this.dataViewerTabService.registerTabHandler();
  }

  load(): void { }
}
