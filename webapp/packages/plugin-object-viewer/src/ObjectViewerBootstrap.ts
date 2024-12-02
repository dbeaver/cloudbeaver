/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { ObjectPropertiesPageService } from './ObjectPropertiesPage/ObjectPropertiesPageService.js';
import { ObjectPropertyTableFooterService } from './ObjectPropertiesPage/ObjectPropertyTable/ObjectPropertyTableFooterService.js';
import { ObjectViewerTabService } from './ObjectViewerTabService.js';

@injectable()
export class ObjectViewerBootstrap extends Bootstrap {
  constructor(
    private readonly objectViewerTabService: ObjectViewerTabService,
    private readonly objectPropertiesPageService: ObjectPropertiesPageService,
    private readonly objectPropertyTableFooterService: ObjectPropertyTableFooterService,
  ) {
    super();
  }

  override register(): void {
    this.objectViewerTabService.registerTabHandler();
    this.objectPropertiesPageService.registerDBObjectPage();
    this.objectPropertyTableFooterService.registerFooterActions();
  }
}
