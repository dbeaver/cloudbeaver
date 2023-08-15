/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { ExecutorInterrupter } from '@cloudbeaver/core-executor';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { CachedDataResource, CachedResource, GraphQLService } from '@cloudbeaver/core-sdk';

import { DataSynchronizationService } from './DataSynchronization/DataSynchronizationService';
import { SessionDataResource } from './SessionDataResource';
import { ServerEventId } from './SessionEventSource';
import { ISessionPermissionEvent, SessionPermissionEventHandler } from './SessionPermissionEventHandler';
import { SessionResource } from './SessionResource';

@injectable()
export class SessionPermissionsResource extends CachedDataResource<Set<string>> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly dataSynchronizationService: DataSynchronizationService,
    private readonly localizationService: LocalizationService,
    sessionDataResource: SessionDataResource,
    sessionResource: SessionResource,
    sessionPermissionEventHandler: SessionPermissionEventHandler,
  ) {
    super(() => new Set());

    this.sync(
      sessionDataResource,
      () => {},
      () => {},
    );

    sessionPermissionEventHandler.onEvent<ISessionPermissionEvent>(
      ServerEventId.CbSubjectPermissionsUpdated,
      () => {
        this.dataSynchronizationService
          .requestSynchronization('permissions', this.localizationService.translate('app_root_event_permissions_changed_message'))
          .then(state => {
            if (state) {
              sessionResource.markOutdated();
            }
          });
      },
      undefined,
      sessionResource,
    );
  }

  require(resource: CachedResource<any, any, any, any, any>, ...permissions: string[]): this {
    resource.preloadResource(this, () => undefined).before(ExecutorInterrupter.interrupter(() => !this.has(...permissions)));

    return this;
  }

  has(...permissions: string[]): boolean {
    return !permissions.some(permission => !this.data.has(permission));
  }

  async hasAsync(id: string): Promise<boolean> {
    await this.load();
    return this.has(id);
  }

  protected async loader(): Promise<Set<string>> {
    const { permissions } = await this.graphQLService.sdk.sessionPermissions();

    this.data.clear();
    for (const permission of permissions) {
      this.data.add(permission);
    }

    return this.data;
  }
}
