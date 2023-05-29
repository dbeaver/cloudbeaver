/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ActionService, DATA_CONTEXT_MENU, menuExtractItems, MenuService } from '@cloudbeaver/core-view';
import { MENU_TOOLS, ToolsPanelService } from '@cloudbeaver/plugin-tools-panel';

import { ACTION_LOG_VIEWER_ENABLE } from '../Actions/ACTION_LOG_VIEWER_ENABLE';
import { LogViewer } from './LogViewer';
import { LogViewerService } from './LogViewerService';

@injectable()
export class LogViewerBootstrap extends Bootstrap {
  constructor(
    private readonly toolsPanelService: ToolsPanelService,
    private readonly menuService: MenuService,
    private readonly actionService: ActionService,
    private readonly logViewerService: LogViewerService,
  ) {
    super();
  }

  register(): void {
    this.menuService.addCreator({
      isApplicable: context => context.tryGet(DATA_CONTEXT_MENU) === MENU_TOOLS,
      getItems: (context, items) => [...items, ACTION_LOG_VIEWER_ENABLE],
      orderItems: (context, items) => {
        const extracted = menuExtractItems(items, [ACTION_LOG_VIEWER_ENABLE]);
        return [...items, ...extracted];
      },
    });

    this.actionService.addHandler({
      id: 'log-viewer-base',
      isActionApplicable: (context, action) => [ACTION_LOG_VIEWER_ENABLE].includes(action),
      isChecked: () => this.logViewerService.isActive,
      isHidden: () => this.logViewerService.disabled,
      handler: (context, action) => {
        switch (action) {
          case ACTION_LOG_VIEWER_ENABLE: {
            this.logViewerService.toggle();
            break;
          }
        }
      },
    });

    this.toolsPanelService.tabsContainer.add({
      key: 'log-viewer-tab',
      order: 0,
      name: 'plugin_log_viewer_action_enable_label',
      isHidden: () => this.logViewerService.disabled || !this.logViewerService.isActive,
      onClose: () => this.logViewerService.toggle(),
      panel: () => LogViewer,
    });
  }

  load(): void {}
}
