/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';

@injectable(() => [])
export class ServerConfigurationFeatureGroupsService {
  readonly featureGroups = new Map<string, string>();

  constructor() {
    makeObservable(this, {
      featureGroups: observable.shallow,
    });
  }

  assignFeaturesToGroup(groupId: string, featureIds: readonly string[]): void {
    for (const featureId of featureIds) {
      this.featureGroups.set(featureId, groupId);
    }
  }
}
