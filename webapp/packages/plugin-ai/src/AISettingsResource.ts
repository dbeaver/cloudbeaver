/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { ServerConfigResource, ServerEventId, WorkspaceConfigEventHandler } from '@cloudbeaver/core-root';
import { type AiSettingsConfig, type AiSettingsInfo, GraphQLService } from '@cloudbeaver/core-sdk';

export type AISettings = AiSettingsInfo;

@injectable(() => [GraphQLService, ServerConfigResource, WorkspaceConfigEventHandler])
export class AISettingsResource extends CachedDataResource<AISettings | null> {
  constructor(
    private readonly graphQLService: GraphQLService,
    serverConfigResource: ServerConfigResource,
    workspaceConfigEventHandler: WorkspaceConfigEventHandler,
  ) {
    super(() => null);

    this.sync(serverConfigResource);
    workspaceConfigEventHandler.onEvent(ServerEventId.CbWorkspaceConfigChanged, () => this.markOutdated(), undefined, this);
  }

  async saveSettings(settings: AiSettingsConfig): Promise<void> {
    await this.performUpdate(undefined, undefined, async () => {
      const { result } = await this.graphQLService.sdk.saveAiSettings({ settings });
      this.setData(result);
    });
  }

  protected async loader(): Promise<AISettings> {
    const { settings } = await this.graphQLService.sdk.getAiSettings();
    return settings;
  }
}
