/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';

import { ObjectPropertiesPageService } from './ObjectPropertiesPage/ObjectPropertiesPageService';
import { ObjectViewerTabService } from './ObjectViewerTabService';

@injectable()
export class ObjectViewerBootstrap {

  constructor(
    private objectViewerTabService: ObjectViewerTabService,
    private objectPropertiesPageService: ObjectPropertiesPageService
  ) { }

  bootstrap() {
    this.objectViewerTabService.registerTabHandler();
    this.objectPropertiesPageService.registerDBObjectPage();
  }
}
