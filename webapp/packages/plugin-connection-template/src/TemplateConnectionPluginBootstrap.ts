/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AppAuthService } from '@cloudbeaver/core-authentication';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { ProjectInfoResource, ProjectsService } from '@cloudbeaver/core-projects';
import { PermissionsService } from '@cloudbeaver/core-root';
import { CachedMapAllKey, getCachedDataResourceLoaderState, getCachedMapResourceLoaderState } from '@cloudbeaver/core-sdk';
import { ActionService, DATA_CONTEXT_LOADABLE_STATE, DATA_CONTEXT_MENU, MenuService } from '@cloudbeaver/core-view';
import { MENU_CONNECTIONS } from '@cloudbeaver/plugin-connections';

import { ACTION_CONNECTION_TEMPLATE } from './Actions/ACTION_CONNECTION_TEMPLATE';
import { ConnectionDialog } from './ConnectionDialog/ConnectionDialog';
import { TemplateConnectionsResource } from './TemplateConnectionsResource';
import { TemplateConnectionsService } from './TemplateConnectionsService';

@injectable()
export class TemplateConnectionPluginBootstrap extends Bootstrap {
  constructor(
    private readonly appAuthService: AppAuthService,
    private readonly menuService: MenuService,
    private readonly actionService: ActionService,
    private readonly projectInfoResource: ProjectInfoResource,
    private readonly templateConnectionsResource: TemplateConnectionsResource,
    private readonly commonDialogService: CommonDialogService,
    private readonly permissionsService: PermissionsService,
    private readonly templateConnectionsService: TemplateConnectionsService,
    private readonly projectsService: ProjectsService,
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.menuService.addCreator({
      isApplicable: context => context.tryGet(DATA_CONTEXT_MENU) === MENU_CONNECTIONS,
      getItems: (context, items) => [...items, ACTION_CONNECTION_TEMPLATE],
    });

    this.actionService.addHandler({
      id: 'connection-template',
      isActionApplicable: (context, action) => [ACTION_CONNECTION_TEMPLATE].includes(action),
      isHidden: () =>
        !this.appAuthService.authenticated ||
        !this.projectsService.userProject?.canEditDataSources ||
        !this.templateConnectionsService.projectTemplates.length,
      getLoader: (context, action) => {
        const state = context.get(DATA_CONTEXT_LOADABLE_STATE);

        return state.getState(action.id, () => [
          ...this.appAuthService.loaders,
          getCachedMapResourceLoaderState(this.projectInfoResource, CachedMapAllKey),
          getCachedDataResourceLoaderState(this.templateConnectionsResource, undefined, undefined),
        ]);
      },
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

  load(): void | Promise<void> {}

  private async openConnectionsDialog() {
    await this.commonDialogService.open(ConnectionDialog, null);
  }
}
