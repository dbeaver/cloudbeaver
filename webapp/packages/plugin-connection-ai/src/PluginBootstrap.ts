/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { ConnectionAiSettingsService } from './connection-ai-settings/ConnectionAiSettingsService.js';
import { AIChatScopeService } from './connection-custom-scope/ai-chat/AIChatScopeService.js';
import { ConnectionAiScopeService } from './connection-custom-scope/connection-ai-settings/ConnectionAiScopeService.js';

@injectable(() => [ConnectionAiSettingsService, AIChatScopeService, ConnectionAiScopeService])
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly connectionAiSettingsService: ConnectionAiSettingsService,
    private readonly aiChatScopeService: AIChatScopeService,
    private readonly connectionAiScopeService: ConnectionAiScopeService,
  ) {
    super();
  }

  override register(): void {
    this.connectionAiSettingsService.register();
    this.aiChatScopeService.register();
    this.connectionAiScopeService.register();
  }
}
