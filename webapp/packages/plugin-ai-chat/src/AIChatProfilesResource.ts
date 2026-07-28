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
import { type AiConfigurationProfileInfo, GraphQLService } from '@cloudbeaver/core-sdk';

export type AIChatProfile = AiConfigurationProfileInfo;

@injectable(() => [GraphQLService, ServerConfigResource, WorkspaceConfigEventHandler])
export class AIChatProfilesResource extends CachedDataResource<AIChatProfile[]> {
  constructor(
    private readonly graphQLService: GraphQLService,
    serverConfigResource: ServerConfigResource,
    workspaceConfigEventHandler: WorkspaceConfigEventHandler,
  ) {
    super(() => []);

    this.sync(serverConfigResource);

    workspaceConfigEventHandler.onEvent(
      ServerEventId.CbWorkspaceConfigChanged,
      () => {
        this.markOutdated();
      },
      undefined,
      this,
    );
  }

  protected async loader(): Promise<AIChatProfile[]> {
    const { profiles } = await this.graphQLService.sdk.getAiProfiles();
    return profiles;
  }
}
