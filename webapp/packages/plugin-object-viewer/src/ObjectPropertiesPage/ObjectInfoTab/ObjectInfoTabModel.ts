/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ITab } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';

import { ObjectInfoTab } from './ObjectInfoTab';

@injectable()
export class ObjectInfoTabModel implements ITab {
  readonly tabId = 'infoTab';
  title = 'Info';
  icon = 'platform:/plugin/org.jkiss.dbeaver.model/icons/tree/info.png';

  panel = ObjectInfoTab;

  onActivate = () => {};

}
