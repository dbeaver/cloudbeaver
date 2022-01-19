/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createDataContext } from '../DataContext/createDataContext';

export const DATA_CONTEXT_MENU_NESTED = createDataContext<boolean>('menu-nested', false);
