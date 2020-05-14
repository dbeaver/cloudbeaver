/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled from 'reshadow';

import { Placeholder } from '@dbeaver/core/blocks';
import { useService } from '@dbeaver/core/di';
import { useStyles } from '@dbeaver/core/theming';

import { TopNavService } from './TopNavBarService';
import { topNavBarStyles } from './topNavBarStyles';

export function TopNavBar() {
  const topNavBarService = useService(TopNavService);

  return styled(useStyles(topNavBarStyles))(
    <header>
      <Placeholder container={topNavBarService.placeholder} />
    </header>
  );
}
