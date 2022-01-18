/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable, Bootstrap } from '@cloudbeaver/core-di';
import { ScreenService } from '@cloudbeaver/core-routing';

import { SqlEditorScreenService } from './SqlEditorScreenService';

@injectable()
export class SqlEditorScreenBootstrap extends Bootstrap {
  constructor(
    private readonly screenService: ScreenService,
    private sqlEditorScreenService: SqlEditorScreenService
  ) {
    super();
  }

  register(): void {
    this.screenService.create(this.sqlEditorScreenService.screen);
  }

  load(): void | Promise<void> { }
}
