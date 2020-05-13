/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Subject, Observable } from 'rxjs';

import { injectable } from '@dbeaver/core/di';
import { GraphQLService, CachedResource } from '@dbeaver/core/sdk';

import { SessionService } from './SessionService';

type PermissionsMetadata = {
  loaded: boolean;
}

@injectable()
export class PermissionsService {
  readonly onUpdate: Observable<unknown>;

  private updateSubject: Subject<unknown>;
  private permissions = new CachedResource(
    new Map(),
    this.refreshAsync.bind(this),
    (_, { loaded }) => loaded
  );


  constructor(
    private graphQLService: GraphQLService,
    private sessionService: SessionService,
  ) {
    this.updateSubject = new Subject();
    this.onUpdate = this.updateSubject.asObservable();
    this.sessionService.onUpdate.subscribe(this.update.bind(this));
  }

  has(id: string): boolean {
    return this.permissions.data.has(id);
  }

  async hasAsync(id: string): Promise<boolean> {
    const permissions = await this.permissions.load();
    return permissions.has(id);
  }

  async update() {
    await this.permissions.refresh();
    this.updateSubject.next();
  }

  private async refreshAsync(
    data: Map<string, string>,
    metadata: PermissionsMetadata
  ): Promise<Map<string, string>> {
    const { permissions } = await this.graphQLService.gql.sessionPermissions();

    data.clear();
    for (const permission of permissions) {
      data.set(permission, permission);
    }
    metadata.loaded = true;

    return data;
  }
}
