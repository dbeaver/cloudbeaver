/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Placeholder } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { AdministrationTopAppBarService } from './AdministrationTopAppBarService.js';

export function AdministrationTopAppBar() {
  const administrationTopAppBarService = useService(AdministrationTopAppBarService);

  return <Placeholder container={administrationTopAppBarService.navBarPlaceholder} />;
}
