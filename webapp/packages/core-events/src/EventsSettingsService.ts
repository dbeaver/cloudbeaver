/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Dependency, injectable } from '@cloudbeaver/core-di';
import { createSettingsAliasResolver, PluginManagerService, PluginSettings, SettingsManagerService } from '@cloudbeaver/core-plugin';
import { ServerSettingsResolverService, ServerSettingsService } from '@cloudbeaver/core-root';
import { schema } from '@cloudbeaver/core-utils';

const settingsSchema = schema.object({
  notificationsPool: schema.coerce.number().default(20),
  maxPersistentAllow: schema.coerce.number().default(5),
});

export type EventsSettings = schema.infer<typeof settingsSchema>;

@injectable()
export class EventsSettingsService extends Dependency {
  readonly settings: PluginSettings<typeof settingsSchema>;

  constructor(
    private readonly pluginManagerService: PluginManagerService,
    private readonly settingsManagerService: SettingsManagerService,
    private readonly serverSettingsService: ServerSettingsService,
    private readonly serverSettingsResolverService: ServerSettingsResolverService,
  ) {
    super();
    this.settings = this.pluginManagerService.createSettings('notifications', 'plugin', settingsSchema);

    this.serverSettingsResolverService.addResolver(
      /** @deprecated Use settings instead, will be removed in 23.0.0 */
      createSettingsAliasResolver(this.serverSettingsService, this.settings, 'core_events'),
    );
    this.registerSettings();
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings(this.settings, () => [
      // {
      //   group: NOTIFICATIONS_SETTINGS_GROUP,
      //   key: 'maxPersistentAllow',
      //   name: 'Max persistent notifications count',
      //   type: ESettingsValueType.Input,
      // },
      // {
      //   group: NOTIFICATIONS_SETTINGS_GROUP,
      //   key: 'notificationsPool',
      //   name: 'Max notifications count',
      //   type: ESettingsValueType.Input,
      // },
    ]);
  }
}
