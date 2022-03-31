/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { EMainMenu, MainMenuService } from '../../../TopNavBar/MainMenu/MainMenuService';
import { ToolsPanelService } from '../ToolsPanelService';
import { LogViewer } from './LogViewer';
import { LogViewerService } from './LogViewerService';

@injectable()
export class LogViewerBootstrap extends Bootstrap {
  constructor(
    private readonly mainMenuService: MainMenuService,
    private readonly toolsPanelService: ToolsPanelService,
    private readonly logViewerService: LogViewerService
  ) {
    super();
  }

  register(): void {
    this.mainMenuService.registerMenuItem(
      EMainMenu.mainMenuToolsPanel,
      {
        id: 'openLogViewer',
        order: 1,
        type: 'checkbox',
        isChecked: () => this.logViewerService.isActive,
        title: 'app_shared_toolsMenu_logViewer',
        onClick: () => this.logViewerService.toggle(),
      }
    );

    this.toolsPanelService.tabsContainer.add({
      key: 'log-viewer-tab',
      order: 0,
      name: 'app_shared_toolsMenu_logViewer',
      isHidden: () => !this.logViewerService.isActive,
      onClose: () => this.logViewerService.toggle(),
      panel: () => LogViewer,
    });
  }

  load(): void { }
}
