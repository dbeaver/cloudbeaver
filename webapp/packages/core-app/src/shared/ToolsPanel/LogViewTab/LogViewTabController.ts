/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';

import { LogViewerService } from './LogViewerService';

@injectable()
export class LogViewTabController {

  get isActive(): boolean {
    return this.logViewerService.isActive;
  }

  get log() {
    return this.logViewerService.getLog();
  }

  clearLog = () => this.logViewerService.clearLog()

  constructor(private logViewerService: LogViewerService) {
  }

}
