/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { ActionService, menuExtractItems, MenuService } from '@cloudbeaver/core-view';
import { MENU_TOOLS, ToolsPanelService } from '@cloudbeaver/plugin-tools-panel';

import { ACTION_LOG_VIEWER_ENABLE } from '../Actions/ACTION_LOG_VIEWER_ENABLE.js';
import { LogViewerService } from './LogViewerService.js';

const LogViewer = importLazyComponent(() => import('./LogViewer.js').then(m => m.LogViewer));

export class LogViewerBootstrapImpl extends Bootstrap {
  constructor(
    private readonly toolsPanelService: ToolsPanelService,
    private readonly menuService: MenuService,
    private readonly actionService: ActionService,
    private readonly logViewerService: LogViewerService,
  ) {
    super();
  }

  override register(): void {
    this.menuService.addCreator({
      menus: [MENU_TOOLS],
      getItems: (context, items) => [...items, ACTION_LOG_VIEWER_ENABLE],
      orderItems: (context, items) => {
        items.push(...menuExtractItems(items, [ACTION_LOG_VIEWER_ENABLE]));
        return items;
      },
    });

    this.actionService.addHandler({
      id: 'log-viewer-base',
      actions: [ACTION_LOG_VIEWER_ENABLE],
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
}

export type LogViewerBootstrap = LogViewerBootstrapImpl;

export class LogViewerBootstrapDI extends Context.Service<LogViewerBootstrapDI, LogViewerBootstrapImpl>()(
  '@cloudbeaver/plugin-log-viewer/LogViewer/LogViewerBootstrap#LogViewerBootstrap',
) {
  static readonly implementation = LogViewerBootstrapImpl;

  static readonly dependencies = () => [ToolsPanelService, MenuService, ActionService, LogViewerService] as const;
  static readonly make: Effect.Effect<
    LogViewerBootstrapImpl,
    never,
    | Context.Service.Identifier<typeof ToolsPanelService>
    | Context.Service.Identifier<typeof MenuService>
    | Context.Service.Identifier<typeof ActionService>
    | Context.Service.Identifier<typeof LogViewerService>
  > = Effect.gen(function* makeLogViewerBootstrap() {
    const toolsPanelService = yield* ToolsPanelService;
    const menuService = yield* MenuService;
    const actionService = yield* ActionService;
    const logViewerService = yield* LogViewerService;

    return new LogViewerBootstrapImpl(toolsPanelService, menuService, actionService, logViewerService);
  });
  static readonly layer: Layer.Layer<
    LogViewerBootstrapDI,
    never,
    | Context.Service.Identifier<typeof ToolsPanelService>
    | Context.Service.Identifier<typeof MenuService>
    | Context.Service.Identifier<typeof ActionService>
    | Context.Service.Identifier<typeof LogViewerService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const LogViewerBootstrap = LogViewerBootstrapDI;
