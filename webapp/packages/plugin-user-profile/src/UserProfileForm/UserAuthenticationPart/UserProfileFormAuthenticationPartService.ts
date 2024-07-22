/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';

import type { UserProfileFormProps } from '../UserProfileFormService';

@injectable()
export class UserProfileFormAuthenticationPartService {
  placeholderContainer: PlaceholderContainer<UserProfileFormProps>;
  constructor() {
    this.placeholderContainer = new PlaceholderContainer();
  }
}
