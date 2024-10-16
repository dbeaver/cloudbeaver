/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { Loader, usePermission } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { EAdminPermission } from '@cloudbeaver/core-root';
import type { ScreenComponent } from '@cloudbeaver/core-routing';

import { Administration } from '../Administration/Administration.js';
import { AdministrationTopAppBar } from './AdministrationTopAppBar/AdministrationTopAppBar.js';
import type { IAdministrationScreenParams } from './IAdministrationScreenParams.js';

export const AdministrationScreen: ScreenComponent<IAdministrationScreenParams> = observer(function AdministrationScreen() {
  const administrationScreenService = useService(AdministrationScreenService);

  const handleSelect = useCallback((item: string) => administrationScreenService.navigateToItem(item), [administrationScreenService]);

  const accessProvided = usePermission(EAdminPermission.admin);

  return (
    <>
      <AdministrationTopAppBar />
      {accessProvided && (
        <Loader suspense>
          <Administration configurationWizard={false} activeScreen={administrationScreenService.activeScreen} onItemSelect={handleSelect} />
        </Loader>
      )}
    </>
  );
});
