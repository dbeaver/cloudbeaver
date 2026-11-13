/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import {
  AdministrationItemService,
  AdministrationItemType,
  type IAdministrationItem,
  ServerConfigurationFeatureGroupsService,
} from '@cloudbeaver/core-administration';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { FEATURE_AI_ID, ServerConfigResource } from '@cloudbeaver/core-root';
import { ConfirmationDialog, importLazyComponent } from '@cloudbeaver/core-blocks';
import { getCachedDataResourceLoaderState } from '@cloudbeaver/core-resource';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ServerConfigurationConfigurationService } from '@cloudbeaver/plugin-administration';
import { FEATURE_GROUP_AI_ID } from '@cloudbeaver/plugin-ai';

import { ADMINISTRATION_AI_PAGE } from './ADMINISTRATION_AI_PAGE.js';
import { AISettingsService } from './AISettingsService.js';
import { EAIAdministrationSub } from './AIAdministrationNavigationService.js';

const ServerConfigurationAISection = importLazyComponent(() =>
  import('./ServerConfiguration/ServerConfigurationAISection.js').then(m => m.ServerConfigurationAISection),
);

const AIAdministrationPanel = React.lazy(async () => {
  const { AIAdministrationPanel } = await import('./AIAdministrationPanel.js');
  return { default: AIAdministrationPanel };
});

const AIDrawerItem = React.lazy(async () => {
  const { AIDrawerItem } = await import('./AIDrawerItem.js');
  return { default: AIDrawerItem };
});

export class AIAdministrationBootstrapImpl extends Bootstrap {
  administrationItem!: IAdministrationItem;

  constructor(
    private readonly administrationItemService: AdministrationItemService,
    private readonly serverConfigResource: ServerConfigResource,
    private readonly aiSettingsService: AISettingsService,
    private readonly commonDialogService: CommonDialogService,
    private readonly serverConfigurationConfigurationService: ServerConfigurationConfigurationService,
    private readonly serverConfigurationFeatureGroupsService: ServerConfigurationFeatureGroupsService,
  ) {
    super();
  }

  override register(): void {
    this.serverConfigurationFeatureGroupsService.assignFeaturesToGroup(FEATURE_GROUP_AI_ID, [FEATURE_AI_ID]);
    this.serverConfigurationConfigurationService.settingsContainer.add(ServerConfigurationAISection, 2);

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

export type AIAdministrationBootstrap = AIAdministrationBootstrapImpl;

export class AIAdministrationBootstrapDI extends Context.Service<AIAdministrationBootstrapDI, AIAdministrationBootstrapImpl>()(
  '@cloudbeaver/plugin-ai-administration/AIAdministrationBootstrap#AIAdministrationBootstrap',
) {
  static readonly implementation = AIAdministrationBootstrapImpl;
  static readonly dependencies = () =>
    [
      AdministrationItemService,
      ServerConfigResource,
      AISettingsService,
      CommonDialogService,
      ServerConfigurationConfigurationService,
      ServerConfigurationFeatureGroupsService,
    ] as const;
  static readonly make: Effect.Effect<
    AIAdministrationBootstrapImpl,
    never,
    | Context.Service.Identifier<typeof AdministrationItemService>
    | Context.Service.Identifier<typeof ServerConfigResource>
    | Context.Service.Identifier<typeof AISettingsService>
    | Context.Service.Identifier<typeof CommonDialogService>
    | Context.Service.Identifier<typeof ServerConfigurationConfigurationService>
    | Context.Service.Identifier<typeof ServerConfigurationFeatureGroupsService>
  > = Effect.gen(function* makeAIAdministrationBootstrap() {
    const administrationItemService = yield* AdministrationItemService;
    const serverConfigResource = yield* ServerConfigResource;
    const aiSettingsService = yield* AISettingsService;
    const commonDialogService = yield* CommonDialogService;
    const serverConfigurationConfigurationService = yield* ServerConfigurationConfigurationService;
    const serverConfigurationFeatureGroupsService = yield* ServerConfigurationFeatureGroupsService;
    return new AIAdministrationBootstrapImpl(
      administrationItemService,
      serverConfigResource,
      aiSettingsService,
      commonDialogService,
      serverConfigurationConfigurationService,
      serverConfigurationFeatureGroupsService,
    );
  });
  static readonly layer: Layer.Layer<
    AIAdministrationBootstrapDI,
    never,
    | Context.Service.Identifier<typeof AdministrationItemService>
    | Context.Service.Identifier<typeof ServerConfigResource>
    | Context.Service.Identifier<typeof AISettingsService>
    | Context.Service.Identifier<typeof CommonDialogService>
    | Context.Service.Identifier<typeof ServerConfigurationConfigurationService>
    | Context.Service.Identifier<typeof ServerConfigurationFeatureGroupsService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AIAdministrationBootstrap = AIAdministrationBootstrapDI;
