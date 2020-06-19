/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';

import { EMainMenu, MainMenuService } from '../../../TopNavBar/MainMenu/MainMenuService';
import { LogViewerService } from './LogViewerService';

@injectable()
export class LogViewerMenuService {

  constructor(private mainMenuService: MainMenuService,
              private logViewerService: LogViewerService) {
  }

  registerMenuItems() {
    this.mainMenuService.registerMenuItem(
      EMainMenu.mainMenuToolsPanel,
      {
        id: 'openLogViewer',
        order: 1,
        title: 'app_shared_toolsMenu_logViewer',
        onClick: () => this.toggleLogViewer(),
      }
    );
  }

  toggleLogViewer() {
    this.logViewerService.toggle();
  }
}
