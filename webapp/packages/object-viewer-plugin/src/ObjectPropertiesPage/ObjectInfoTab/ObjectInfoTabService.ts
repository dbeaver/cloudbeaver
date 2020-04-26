/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { TabEntity } from '@dbeaver/core/app';
import { injectable } from '@dbeaver/core/di';

import { ObjectInfoTabModel } from './ObjectInfoTabModel';

@injectable()
export class ObjectInfoTabService {

  createTabEntity(): TabEntity {
    return new TabEntity(ObjectInfoTabModel);
  }

}
