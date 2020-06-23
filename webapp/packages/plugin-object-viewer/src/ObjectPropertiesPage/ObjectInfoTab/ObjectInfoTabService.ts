/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { TabEntity, NavNodeManagerService, ENodeFeature } from '@cloudbeaver/core-app';
import { injectable } from '@cloudbeaver/core-di';

import { ObjectInfoTabModel } from './ObjectInfoTabModel';

@injectable()
export class ObjectInfoTabService {

  constructor(
    private navNodeManagerService: NavNodeManagerService,
  )
  {}

  createTabEntity(navNodeId: string): TabEntity | null {
    const node = this.navNodeManagerService.getNode(navNodeId);
    const isDatabaseObject = node?.features?.includes(ENodeFeature.item)
      || node?.features?.includes(ENodeFeature.container);
    if (!isDatabaseObject) {
      return null;
    }

    return new TabEntity(ObjectInfoTabModel);
  }

}
