/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { SettingsManagerService, SettingsProvider, SettingsProviderService } from '@cloudbeaver/core-settings';
import { schema } from '@cloudbeaver/core-utils';

const settingsSchema = schema.object({
  'plugin.notifications.notificationsPool': schema.coerce.number().default(20),
  'plugin.notifications.maxPersistentAllow': schema.coerce.number().default(5),
});

export type EventsSettingsSchema = typeof settingsSchema;
export type EventsSettings = schema.infer<EventsSettingsSchema>;

export class EventsSettingsServiceImpl {
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

export type EventsSettingsService = EventsSettingsServiceImpl;

export class EventsSettingsServiceDI extends Context.Service<EventsSettingsServiceDI, EventsSettingsServiceImpl>()(
  '@cloudbeaver/core-events/EventsSettingsService#EventsSettingsService',
) {
  static readonly implementation = EventsSettingsServiceImpl;

  static readonly dependencies = () => [SettingsProviderService, SettingsManagerService] as const;
  static readonly make: Effect.Effect<
    EventsSettingsServiceImpl,
    never,
    Context.Service.Identifier<typeof SettingsProviderService> | Context.Service.Identifier<typeof SettingsManagerService>
  > = Effect.gen(function* makeEventsSettingsService() {
    const settingsProviderService = yield* SettingsProviderService;
    const settingsManagerService = yield* SettingsManagerService;

    return new EventsSettingsServiceImpl(settingsProviderService, settingsManagerService);
  });
  static readonly layer: Layer.Layer<
    EventsSettingsServiceDI,
    never,
    Context.Service.Identifier<typeof SettingsProviderService> | Context.Service.Identifier<typeof SettingsManagerService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const EventsSettingsService = EventsSettingsServiceDI;
