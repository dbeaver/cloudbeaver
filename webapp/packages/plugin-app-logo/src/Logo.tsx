/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { AppLogo, useResource } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { PermissionsService, ProductInfoResource } from '@cloudbeaver/core-root';
import { ScreenService } from '@cloudbeaver/core-routing';
import { useAppVersion } from '@cloudbeaver/core-version';
import { HolidaysService } from '@cloudbeaver/plugin-holidays';

export const Logo = observer(function Logo() {
  const productInfoResource = useResource(Logo, ProductInfoResource, undefined);
  const screenService = useService(ScreenService);
  const permissionsService = useService(PermissionsService);
  const { backendVersion, frontendVersion } = useAppVersion(true);
  const { holiday } = useService(HolidaysService);

  const isSameVersion = backendVersion === frontendVersion;

  const productName = productInfoResource.data?.name || 'CloudBeaver';
  const backendVersionTitle = `${productName} ver. ${backendVersion}`;
  const commonVersionTitle = `${productName} ver. ${frontendVersion}(${backendVersion})`;

  const title = isSameVersion ? backendVersionTitle : commonVersionTitle;

  return <AppLogo title={title} iconSrc={holiday?.logoSrc} onClick={permissionsService.publicDisabled ? undefined : screenService.navigateToRoot} />;
});
