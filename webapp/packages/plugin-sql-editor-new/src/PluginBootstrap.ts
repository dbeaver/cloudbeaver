/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { SQLCodeEditorPanelService } from './SQLEditor/SQLCodeEditorPanel/SQLCodeEditorPanelService';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly sqlCodeEditorPanelService: SQLCodeEditorPanelService
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.sqlCodeEditorPanelService.registerPanel();
  }

  load(): void | Promise<void> { }
}