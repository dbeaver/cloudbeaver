/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { type IScreen, ScreenService } from '@cloudbeaver/core-routing';

import type { ISqlEditorScreenParams } from './ISqlEditorScreenParams.js';
import { SqlEditorScreen } from './SqlEditorScreen.js';
import { SqlEditorScreenSettingsService } from '../SqlEditorScreenSettingsService.js';

@injectable()
export class SqlEditorScreenService {
  readonly screen: IScreen<ISqlEditorScreenParams>;
  constructor(
    private readonly screenService: ScreenService,
    sqlEditorScreenSettingsService: SqlEditorScreenSettingsService,
  ) {
    this.screen = {
      name: 'sql-editor',
      routes: [{ name: 'sql-editor', path: '/sql-editor/:contextId' }],
      component: SqlEditorScreen,
      canDeActivate() {
        return sqlEditorScreenSettingsService.enabled;
      },
    };
  }

  createURL(params: ISqlEditorScreenParams): string {
    return this.screenService.buildUrl(this.screen.name, params);
  }

  navigate(params: ISqlEditorScreenParams): void {
    this.screenService.navigate(this.screen.name, params);
  }
}
