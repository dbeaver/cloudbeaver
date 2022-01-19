/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { RoleInfo } from '@cloudbeaver/core-authentication';
import { PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';

export interface IRoleDetailsInfoProps {
  role: RoleInfo;
}

@injectable()
export class RolesAdministrationService {
  readonly roleDetailsInfoPlaceholder = new PlaceholderContainer<IRoleDetailsInfoProps>();
}
