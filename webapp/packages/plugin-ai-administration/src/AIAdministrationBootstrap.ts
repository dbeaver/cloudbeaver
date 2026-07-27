/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import { AdministrationItemService, AdministrationItemType, type IAdministrationItem } from '@cloudbeaver/core-administration';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { FEATURE_AI_ID, ServerConfigResource } from '@cloudbeaver/core-root';
import { ConfirmationDialog } from '@cloudbeaver/core-blocks';
import { getCachedDataResourceLoaderState } from '@cloudbeaver/core-resource';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';

import { ADMINISTRATION_AI_PAGE } from './ADMINISTRATION_AI_PAGE.js';
import { AISettingsService } from './AISettingsService.js';
import { EAIAdministrationSub } from './AIAdministrationNavigationService.js';

const AIAdministrationPanel = React.lazy(async () => {
  const { AIAdministrationPanel } = await import('./AIAdministrationPanel.js');
  return { default: AIAdministrationPanel };
});

const AIDrawerItem = React.lazy(async () => {
  const { AIDrawerItem } = await import('./AIDrawerItem.js');
  return { default: AIDrawerItem };
});

@injectable(() => [AdministrationItemService, ServerConfigResource, AISettingsService, CommonDialogService])
export class AIAdministrationBootstrap extends Bootstrap {
  administrationItem!: IAdministrationItem;

  constructor(
    private readonly administrationItemService: AdministrationItemService,
    private readonly serverConfigResource: ServerConfigResource,
    private readonly aiSettingsService: AISettingsService,
    private readonly commonDialogService: CommonDialogService,
  ) {
    super();
  }

  override register(): void {
    this.administrationItem = this.administrationItemService.create({
      name: ADMINISTRATION_AI_PAGE,
      type: AdministrationItemType.Administration,
      order: 11,
      defaultSub: EAIAdministrationSub.Settings,
      getContentComponent: () => AIAdministrationPanel,
      getDrawerComponent: () => AIDrawerItem,
      getLoader: () => getCachedDataResourceLoaderState(this.serverConfigResource, () => undefined),
      onActivate: this.aiSettingsService.create.bind(this.aiSettingsService),
      canDeActivate: async () => {
        const edited = this.aiSettingsService.formState?.isChanged;

        if (edited) {
          const { status } = await this.commonDialogService.open(ConfirmationDialog, {
            title: 'ui_discard_changes',
            message: 'ui_discard_changes_message',
            confirmActionText: 'ui_discard',
            cancelActionText: 'ui_keep_editing',
          });

          if (status === DialogueStateResult.Rejected) {
            return false;
          }
        }

        return true;
      },
      onDeActivate: this.aiSettingsService.dispose.bind(this.aiSettingsService),
      isHidden: () => !this.serverConfigResource.isFeatureEnabled(FEATURE_AI_ID, true),
    });
  }

  override async load(): Promise<void> {}
}
