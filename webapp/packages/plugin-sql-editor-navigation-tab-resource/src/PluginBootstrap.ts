/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { INodeNavigationData, NavNodeManagerService } from '@cloudbeaver/core-app';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ScriptsManagerService } from '@cloudbeaver/plugin-resource-manager';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly navNodeManagerService: NavNodeManagerService,
    private readonly scriptsManagerService: ScriptsManagerService
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.navNodeManagerService.navigator.addHandler(this.navigationHandler.bind(this));
  }

  load(): void | Promise<void> { }

  private navigationHandler(data: INodeNavigationData) {
    if (this.scriptsManagerService.isScript(data.nodeId)) {
      this.scriptsManagerService.openScript(data.nodeId);
    }
  }
}