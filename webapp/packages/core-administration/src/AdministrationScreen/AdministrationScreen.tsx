/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useCallback } from 'react';

import { useService } from '@cloudbeaver/core-di';
import { Translate } from '@cloudbeaver/core-localization';
import { usePermission } from '@cloudbeaver/core-root';

import { Administration } from '../Administration/Administration';
import { EAdminPermission } from '../EAdminPermission';
import { AdministrationScreenService } from './AdministrationScreenService';
import { AdministrationTopAppBar } from './AdministrationTopAppBar/AdministrationTopAppBar';

export const AdministrationScreen = observer(function AdministrationScreen() {
  const administrationScreenService = useService(AdministrationScreenService);

  const handleSelect = useCallback(
    (item: string) => administrationScreenService.navigateToItem(item),
    [administrationScreenService]
  );

  if (!usePermission(EAdminPermission.admin)) {
    return <Translate token='root_permission_denied' />;
  }

  return (
    <>
      <AdministrationTopAppBar />
      <Administration
        configurationWizard={false}
        activeItem={administrationScreenService.activeItem}
        activeItemSub={administrationScreenService.activeItemSub}
        activeItemSubParam={administrationScreenService.activeItemSubParam}
        onItemSelect={handleSelect}
      />
    </>
  );
});
