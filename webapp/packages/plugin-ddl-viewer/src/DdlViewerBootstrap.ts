/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { ITabBuilder, ObjectFoldersService } from '@cloudbeaver/plugin-object-viewer';

import { DdlViewerTabService } from './DdlViewerTabService';

@injectable()
export class DdlViewerBootstrap {

  constructor(private objectFoldersService: ObjectFoldersService,
              private ddlViewerTabService: DdlViewerTabService) {
  }

  bootstrap() {
    const tabBuilder: ITabBuilder = {
      build: nodeId => this.ddlViewerTabService.buildTab(nodeId),
    };

    this.objectFoldersService.registerTabConstructor(tabBuilder);
  }
}
