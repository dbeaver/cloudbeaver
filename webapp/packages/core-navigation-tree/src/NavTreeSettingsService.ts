/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Dependency, injectable } from '@cloudbeaver/core-di';
import {
  createSettingsAliasResolver,
  ROOT_SETTINGS_LAYER,
  SettingsManagerService,
  SettingsProvider,
  SettingsProviderService,
  SettingsResolverService,
} from '@cloudbeaver/core-settings';
import { schema, schemaExtra } from '@cloudbeaver/core-utils';

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
    private readonly settingsManagerService: SettingsManagerService,
    private readonly settingsResolverService: SettingsResolverService,
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
      // {
      //   key: 'childrenLimit',
      //   access: {
      //     accessor: ['server'],
      //   },
      //   group: NAVIGATION_TREE_SETTINGS_GROUP,
      //   name: 'Children limit',
      //   type: ESettingsValueType.Input,
      // },
      // {
      //   group: NAVIGATION_TREE_SETTINGS_GROUP,
      //   key: 'editing',
      //   name: 'Editing',
      //   type: ESettingsValueType.Checkbox,
      // },
      // {
      //   group: NAVIGATION_TREE_SETTINGS_GROUP,
      //   key: 'deleting',
      //   name: 'Deleting',
      //   type: ESettingsValueType.Checkbox,
      // },
    ]);
  }
}
