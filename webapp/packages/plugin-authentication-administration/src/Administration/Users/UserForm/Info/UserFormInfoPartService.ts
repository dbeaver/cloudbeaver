/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';

import type { UserFormProps } from '../AdministrationUserFormService.js';

@injectable()
export class UserFormInfoPartService {
  placeholderContainer: PlaceholderContainer<UserFormProps>;
  constructor() {
    this.placeholderContainer = new PlaceholderContainer();
  }
}
