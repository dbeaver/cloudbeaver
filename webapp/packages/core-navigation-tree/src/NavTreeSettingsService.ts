/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Dependency, injectable } from '@cloudbeaver/core-di';
import {
  createSettingsAliasResolver,
  ESettingsValueType,
  ROOT_SETTINGS_LAYER,
  SettingsManagerService,
  SettingsProvider,
  SettingsProviderService,
  SettingsResolverService,
} from '@cloudbeaver/core-settings';
import { schema, schemaExtra } from '@cloudbeaver/core-utils';
import { NAVIGATION_TREE_SETTINGS_GROUP } from './NAVIGATION_TREE_SETTINGS_GROUP.js';

const settingsSchema = schema.object({
  'core.navigation-tree.childrenLimit': schema.coerce.number().min(10).max(1000).default(100),
  'core.navigation-tree.editing': schemaExtra.stringedBoolean().default(true),
  'core.navigation-tree.deleting': schemaExtra.stringedBoolean().default(true),
});

export type NavTreeSettings = schema.infer<typeof settingsSchema>;

@injectable()
export class NavTreeSettingsService extends Dependency {
  get childrenLimit(): number {
    return this.settings.getValue('core.navigation-tree.childrenLimit');
  }
  get editing(): boolean {
    return this.settings.getValue('core.navigation-tree.editing');
  }
  get deleting(): boolean {
    return this.settings.getValue('core.navigation-tree.deleting');
  }
  readonly settings: SettingsProvider<typeof settingsSchema>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsResolverService: SettingsResolverService,
    private readonly settingsManagerService: SettingsManagerService,
  ) {
    super();
    this.settings = this.settingsProviderService.createSettings(settingsSchema);
    this.settingsResolverService.addResolver(
      ROOT_SETTINGS_LAYER,
      /** @deprecated Use settings instead, will be removed in 23.0.0 */
      createSettingsAliasResolver(this.settingsResolverService, this.settings, {
        'core.navigation-tree.childrenLimit': 'core.app.navigationTree.childrenLimit',
      }),
      createSettingsAliasResolver(this.settingsResolverService, this.settings, {
        'core.navigation-tree.deleting': 'core.app.metadata.deleting',
        'core.navigation-tree.editing': 'core.app.metadata.editing',
      }),
    );

    this.registerSettings();
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings(this.settings, () => [
      {
        key: 'core.navigation-tree.childrenLimit',
        access: {
          scope: ['client', 'server'],
        },
        group: NAVIGATION_TREE_SETTINGS_GROUP,
        name: 'core_navigation_tree_settings_children_limit',
        description: 'core_navigation_tree_settings_children_limit_description',
        type: ESettingsValueType.Input,
      },
      {
        group: NAVIGATION_TREE_SETTINGS_GROUP,
        key: 'core.navigation-tree.editing',
        access: {
          scope: ['role'],
        },
        name: 'core_navigation_tree_settings_editing',
        description: 'core_navigation_tree_settings_editing_description',
        type: ESettingsValueType.Checkbox,
      },
      {
        group: NAVIGATION_TREE_SETTINGS_GROUP,
        key: 'core.navigation-tree.deleting',
        access: {
          scope: ['role'],
        },
        name: 'core_navigation_tree_settings_deleting',
        description: 'core_navigation_tree_settings_deleting_description',
        type: ESettingsValueType.Checkbox,
      },
    ]);
  }
}
