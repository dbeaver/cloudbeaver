/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { AppLogo } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ServerService } from '@cloudbeaver/core-root';
import { ScreenService } from '@cloudbeaver/core-routing';

import { useAppVersion } from '../useAppVersion';

export const Logo = observer(function Logo() {
  const serverService = useService(ServerService);
  const screenService = useService(ScreenService);
  const { backendVersion, frontendVersion } = useAppVersion(true);

  const isSameVersion = backendVersion === frontendVersion;

  const productName = serverService.config.data?.productInfo.name || 'CloudBeaver';
  const backendVersionTitle = `${productName} ver. ${backendVersion}`;
  const commonVersionTitle = `${productName} ver. ${frontendVersion}(${backendVersion})`;

  const title = isSameVersion ? backendVersionTitle : commonVersionTitle;

  return <AppLogo title={title} onClick={() => screenService.navigateToRoot()} />;
});
