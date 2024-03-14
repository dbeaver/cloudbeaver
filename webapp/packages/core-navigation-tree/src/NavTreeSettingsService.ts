/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Dependency, injectable } from '@cloudbeaver/core-di';
import { ServerSettingsService } from '@cloudbeaver/core-root';
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

import { NAVIGATION_TREE_SETTINGS_GROUP } from './NAVIGATION_TREE_SETTINGS_GROUP';

const settingsSchema = schema.object({
  childrenLimit: schema.coerce.number().min(10).max(1000).default(100),
  editing: schemaExtra.stringedBoolean().default(true),
  deleting: schemaExtra.stringedBoolean().default(true),
});

export type NavTreeSettings = schema.infer<typeof settingsSchema>;

@injectable()
export class NavTreeSettingsService extends Dependency {
  readonly settings: SettingsProvider<typeof settingsSchema>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
    private readonly serverSettingsService: ServerSettingsService,
    private readonly settingsResolverService: SettingsResolverService,
  ) {
    super();
    this.settings = this.settingsProviderService.createSettings(settingsSchema, 'core', 'navigation-tree');
    this.settingsResolverService.addResolver(
      ROOT_SETTINGS_LAYER,
      /** @deprecated Use settings instead, will be removed in 23.0.0 */
      createSettingsAliasResolver(this.serverSettingsService, this.settings, 'core.app.navigationTree'),
      createSettingsAliasResolver(this.serverSettingsService, this.settings, 'core.app.metadata'),
    );

    this.registerSettings();
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings(this.settings.scope, this.settings.schema, () => [
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
