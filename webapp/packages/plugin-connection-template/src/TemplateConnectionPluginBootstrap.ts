/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AppAuthService } from '@cloudbeaver/core-authentication';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { ProjectInfoResource, ProjectsService } from '@cloudbeaver/core-projects';
import { CachedMapAllKey, getCachedDataResourceLoaderState, getCachedMapResourceLoaderState } from '@cloudbeaver/core-resource';
import { ActionService, MenuService } from '@cloudbeaver/core-view';
import { MENU_CONNECTIONS } from '@cloudbeaver/plugin-connections';

import { ACTION_CONNECTION_TEMPLATE } from './Actions/ACTION_CONNECTION_TEMPLATE.js';
import { TemplateConnectionsResource } from './TemplateConnectionsResource.js';
import { TemplateConnectionsService } from './TemplateConnectionsService.js';

const ConnectionDialog = importLazyComponent(() => import('./ConnectionDialog/ConnectionDialog.js').then(m => m.ConnectionDialog));

@injectable()
export class TemplateConnectionPluginBootstrap extends Bootstrap {
  constructor(
    private readonly appAuthService: AppAuthService,
    private readonly menuService: MenuService,
    private readonly actionService: ActionService,
    private readonly projectInfoResource: ProjectInfoResource,
    private readonly templateConnectionsResource: TemplateConnectionsResource,
    private readonly commonDialogService: CommonDialogService,
    private readonly templateConnectionsService: TemplateConnectionsService,
    private readonly projectsService: ProjectsService,
  ) {
    super();
  }

  override register(): void | Promise<void> {
    this.menuService.addCreator({
      menus: [MENU_CONNECTIONS],
      getItems: (context, items) => [...items, ACTION_CONNECTION_TEMPLATE],
    });

    this.actionService.addHandler({
      id: 'connection-template',
      actions: [ACTION_CONNECTION_TEMPLATE],
      isHidden: () =>
        !this.appAuthService.authenticated ||
        !this.projectsService.userProject?.canEditDataSources ||
        !this.templateConnectionsService.projectTemplates.length,
      getLoader: () => [
        ...this.appAuthService.loaders,
        getCachedMapResourceLoaderState(this.projectInfoResource, () => CachedMapAllKey),
        getCachedDataResourceLoaderState(
          this.templateConnectionsResource,
          () => undefined,
          () => undefined,
        ),
      ],
      handler: async (context, action) => {
        switch (action) {
          case ACTION_CONNECTION_TEMPLATE: {
            await this.openConnectionsDialog();
            break;
          }
        }
      },
    });
  }

  private async openConnectionsDialog() {
    await this.commonDialogService.open(ConnectionDialog, null);
  }
}
