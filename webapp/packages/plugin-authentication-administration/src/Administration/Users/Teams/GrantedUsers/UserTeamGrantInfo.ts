/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { AdminUserTeamGrantInfo } from '@cloudbeaver/core-sdk';
import type { UndefinedToNull } from '@cloudbeaver/core-utils';

export type UserTeamGrantInfo = UndefinedToNull<AdminUserTeamGrantInfo>;
