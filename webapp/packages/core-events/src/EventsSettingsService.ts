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
import { schema } from '@cloudbeaver/core-utils';

const settingsSchema = schema.object({
  'plugin.notifications.notificationsPool': schema.coerce.number().default(20),
  'plugin.notifications.maxPersistentAllow': schema.coerce.number().default(5),
});

export type EventsSettings = schema.infer<typeof settingsSchema>;

@injectable()
export class EventsSettingsService extends Dependency {
  get maxPersistentAllow(): number {
    return this.settings.getValue('plugin.notifications.maxPersistentAllow');
  }
  get notificationsPool(): number {
    return this.settings.getValue('plugin.notifications.notificationsPool');
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
        'plugin.notifications.maxPersistentAllow': 'core_events.maxPersistentAllow',
        'plugin.notifications.notificationsPool': 'core_events.notificationsPool',
      }),
    );
    this.registerSettings();
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings(this.settings, () => [
      // {
      //   group: NOTIFICATIONS_SETTINGS_GROUP,
      //   key: 'plugin.notifications.maxPersistentAllow',
      //   access: {
      //     scope: ['client'],
      //   },
      //   name: 'Max persistent notifications count',
      //   type: ESettingsValueType.Input,
      // },
      // {
      //   group: NOTIFICATIONS_SETTINGS_GROUP,
      //   key: 'plugin.notifications.notificationsPool',
      //   access: {
      //     scope: ['client'],
      //   },
      //   name: 'core_events_notifications_settings_pool_size',
      //   description: 'core_events_notifications_settings_pool_size_description',
      //   type: ESettingsValueType.Input,
      // },
    ]);
  }
}
