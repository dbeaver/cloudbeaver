/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable } from 'mobx';

import { UserConfigurationStorage, UserDataService } from '@cloudbeaver/core-authentication';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { ToolsPanelService } from '@cloudbeaver/plugin-tools-panel';

import { LogViewerSettingsService } from './LogViewerSettingsService.js';

const logViewerSettingsKey = 'log-viewer';

interface ISettings {
  active: boolean;
}

export class LogViewerServiceImpl {
  get settings() {
    return this.userDataService.withStorage(this.userConfigurationStorage).getUserData(logViewerSettingsKey, getLogViewerDefaultSettings);
  }

  get isActive(): boolean {
    return this.settings.active;
  }

  get disabled() {
    return this.toolsPanelService.disabled || this.logViewerSettingsService.disabled;
  }

  constructor(
    private readonly userDataService: UserDataService,
    private readonly toolsPanelService: ToolsPanelService,
    private readonly logViewerSettingsService: LogViewerSettingsService,
    private readonly userConfigurationStorage: UserConfigurationStorage,
  ) {
    makeObservable<LogViewerServiceImpl>(this, {
      settings: computed,
      disabled: computed,
    });
  }

  toggle(): void {
    if (this.isActive) {
      this.settings.active = false;
    } else {
      this.settings.active = true;
    }
  }
}

function getLogViewerDefaultSettings(): ISettings {
  return {
    active: false,
  };
}

export type LogViewerService = LogViewerServiceImpl;

export class LogViewerServiceDI extends Context.Service<LogViewerServiceDI, LogViewerServiceImpl>()(
  '@cloudbeaver/plugin-log-viewer/LogViewer/LogViewerService#LogViewerService',
) {
  static readonly implementation = LogViewerServiceImpl;
  static readonly dependencies = () => [UserDataService, ToolsPanelService, LogViewerSettingsService, UserConfigurationStorage] as const;
  static readonly make: Effect.Effect<
    LogViewerServiceImpl,
    never,
    | Context.Service.Identifier<typeof UserDataService>
    | Context.Service.Identifier<typeof ToolsPanelService>
    | Context.Service.Identifier<typeof LogViewerSettingsService>
    | Context.Service.Identifier<typeof UserConfigurationStorage>
  > = Effect.gen(function* makeLogViewerService() {
    const userDataService = yield* UserDataService;
    const toolsPanelService = yield* ToolsPanelService;
    const logViewerSettingsService = yield* LogViewerSettingsService;
    const userConfigurationStorage = yield* UserConfigurationStorage;

    return new LogViewerServiceImpl(userDataService, toolsPanelService, logViewerSettingsService, userConfigurationStorage);
  });
  static readonly layer: Layer.Layer<
    LogViewerServiceDI,
    never,
    | Context.Service.Identifier<typeof UserDataService>
    | Context.Service.Identifier<typeof ToolsPanelService>
    | Context.Service.Identifier<typeof LogViewerSettingsService>
    | Context.Service.Identifier<typeof UserConfigurationStorage>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const LogViewerService = LogViewerServiceDI;
