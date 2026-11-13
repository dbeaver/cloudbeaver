/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AdministrationItemService, AdministrationItemType } from '@cloudbeaver/core-administration';
import { ConfirmationDialog, importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import type { IEditableSettingsSource } from '@cloudbeaver/core-settings';

import { SettingsAdministrationService } from './SettingsAdministrationService.js';

const SettingsAdministration = importLazyComponent(() => import('./SettingsAdministration.js').then(module => module.SettingsAdministration));
const SettingsDrawerItem = importLazyComponent(() => import('./SettingsDrawerItem.js').then(module => module.SettingsDrawerItem));

export class SettingsAdministrationPluginBootstrapImpl extends Bootstrap {
  constructor(
    private readonly administrationItemService: AdministrationItemService,
    private readonly settingsAdministrationService: SettingsAdministrationService,
    private readonly commonDialogService: CommonDialogService,
  ) {
    super();
  }

  override register(): void | Promise<void> {
    this.administrationItemService.create({
      name: 'settings',
      type: AdministrationItemType.Default,
      order: 3,
      configurationWizardOptions: {
        description: 'plugin_settings_administration_drawer_item_title',
      },
      canDeActivate: async configurationWizard => {
        if (configurationWizard) {
          return true;
        }

        const displayed = this.settingsAdministrationService.tabsContainer.getDisplayed();
        const edited = displayed.some(tab => (tab.options?.source as IEditableSettingsSource).isEdited());

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
      onDeActivate: configurationWizard => {
        if (configurationWizard) {
          return;
        }

        this.settingsAdministrationService.tabsContainer.getDisplayed().forEach(tab => {
          if (tab.options?.source.isEdited()) {
            tab.options?.source.clear();
          }
        });
      },
      getContentComponent: () => SettingsAdministration,
      getDrawerComponent: () => SettingsDrawerItem,
    });
  }
}

export type SettingsAdministrationPluginBootstrap = SettingsAdministrationPluginBootstrapImpl;

export class SettingsAdministrationPluginBootstrapDI extends Context.Service<
  SettingsAdministrationPluginBootstrapDI,
  SettingsAdministrationPluginBootstrapImpl
>()('@cloudbeaver/plugin-settings-administration/SettingsAdministrationPluginBootstrap#SettingsAdministrationPluginBootstrap') {
  static readonly implementation = SettingsAdministrationPluginBootstrapImpl;

  static readonly dependencies = () => [AdministrationItemService, SettingsAdministrationService, CommonDialogService] as const;
  static readonly make: Effect.Effect<
    SettingsAdministrationPluginBootstrapImpl,
    never,
    | Context.Service.Identifier<typeof AdministrationItemService>
    | Context.Service.Identifier<typeof SettingsAdministrationService>
    | Context.Service.Identifier<typeof CommonDialogService>
  > = Effect.gen(function* makeSettingsAdministrationPluginBootstrap() {
    const administrationItemService = yield* AdministrationItemService;
    const settingsAdministrationService = yield* SettingsAdministrationService;
    const commonDialogService = yield* CommonDialogService;

    return new SettingsAdministrationPluginBootstrapImpl(administrationItemService, settingsAdministrationService, commonDialogService);
  });
  static readonly layer: Layer.Layer<
    SettingsAdministrationPluginBootstrapDI,
    never,
    | Context.Service.Identifier<typeof AdministrationItemService>
    | Context.Service.Identifier<typeof SettingsAdministrationService>
    | Context.Service.Identifier<typeof CommonDialogService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SettingsAdministrationPluginBootstrap = SettingsAdministrationPluginBootstrapDI;
