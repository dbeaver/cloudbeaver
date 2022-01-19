/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { IScreen, ScreenService } from '@cloudbeaver/core-routing';

import type { ISqlEditorScreenParams } from './ISqlEditorScreenParams';
import { SqlEditorScreen } from './SqlEditorScreen';

@injectable()
export class SqlEditorScreenService {
  readonly screen: IScreen<ISqlEditorScreenParams>;
  constructor(
    private readonly screenService: ScreenService
  ) {
    this.screen = {
      name: 'sql-editor',
      routes: [
        { name: 'sql-editor', path: '/sql-editor/:contextId' },
      ],
      component: SqlEditorScreen,
    };
  }

  createURL(params: ISqlEditorScreenParams): string {
    return this.screenService.buildUrl(this.screen.name, params);
  }

  navigate(params: ISqlEditorScreenParams): void {
    this.screenService.navigate(this.screen.name, params);
  }
}
