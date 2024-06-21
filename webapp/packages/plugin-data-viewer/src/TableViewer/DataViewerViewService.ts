/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { ACTION_REDO, ACTION_SAVE, ACTION_UNDO, IActiveView, View } from '@cloudbeaver/core-view';
import { ITab, NavigationTabsService } from '@cloudbeaver/plugin-navigation-tabs';

@injectable()
export class DataViewerViewService extends View<ITab> {
  constructor(private readonly navigationTabsService: NavigationTabsService) {
    super();
    this.registerAction(ACTION_UNDO, ACTION_REDO, ACTION_SAVE);
  }

  getView(): IActiveView<ITab> | null {
    return this.navigationTabsService.getView();
  }
}
