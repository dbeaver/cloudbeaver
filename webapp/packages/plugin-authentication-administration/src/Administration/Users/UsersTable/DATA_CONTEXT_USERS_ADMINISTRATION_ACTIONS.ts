/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createDataContext } from '@cloudbeaver/core-data-context';

export interface IUsersAdministrationActions {
  onRefresh: () => void;
}

export const DATA_CONTEXT_USERS_ADMINISTRATION_ACTIONS = createDataContext<IUsersAdministrationActions>('Users Administration Actions');
