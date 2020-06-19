/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';

import { DataViewerTabService } from './DataViewerTabService';

@injectable()
export class DataViewerBootstrap {
  constructor(private dataViewerTabService: DataViewerTabService) { }

  bootstrap() {
    this.dataViewerTabService.registerTabHandler();
  }
}
