/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { SettingsManagerService, SettingsProvider, SettingsProviderService } from '@cloudbeaver/core-settings';
import { schema } from '@cloudbeaver/core-utils';

const settingsSchema = schema.object({
  'plugin.notifications.notificationsPool': schema.coerce.number().default(20),
  'plugin.notifications.maxPersistentAllow': schema.coerce.number().default(5),
});

export type EventsSettingsSchema = typeof settingsSchema;
export type EventsSettings = schema.infer<EventsSettingsSchema>;

@injectable(() => [SettingsProviderService, SettingsManagerService])
export class EventsSettingsService {
  get maxPersistentAllow(): number {
    return this.settings.getValue('plugin.notifications.maxPersistentAllow');
  }
  get notificationsPool(): number {
    return this.settings.getValue('plugin.notifications.notificationsPool');
  }
  readonly settings: SettingsProvider<EventsSettingsSchema>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
  ) {
    this.settings = this.settingsProviderService.createSettings(settingsSchema);
    this.registerSettings();
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings<typeof settingsSchema>(() => [
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
