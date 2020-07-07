/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Subject, Observable } from 'rxjs';

import { injectable } from '@cloudbeaver/core-di';

import { PermissionsResource } from './PermissionsResource';
import { SessionResource } from './SessionResource';

export enum EPermission {
  public = 'public'
}

@injectable()
export class PermissionsService {
  readonly onUpdate: Observable<unknown>;

  private updateSubject: Subject<unknown>;

  constructor(
    private sessionResource: SessionResource,
    private permissions: PermissionsResource,
  ) {
    this.updateSubject = new Subject();
    this.onUpdate = this.updateSubject.asObservable();
    this.sessionResource.onDataUpdate.subscribe(this.update.bind(this));
  }

  has(id: string): boolean {
    return this.permissions.has(id);
  }

  async hasAsync(id: string): Promise<boolean> {
    await this.permissions.load(null);
    return this.has(id);
  }

  async update() {
    await this.permissions.refresh(null);
    this.updateSubject.next();
  }
}
