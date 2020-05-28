/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useCallback } from 'react';

import { useService } from '@dbeaver/core/di';
import { Translate } from '@dbeaver/core/localization';
import { usePermission } from '@dbeaver/core/root';

import { Administration } from '../Administration/Administration';
import { EAdminPermission } from '../EAdminPermission';
import { AdministrationScreenService } from './AdministrationScreenService';
import { AdministrationTopAppBar } from './AdministrationTopAppBar/AdministrationTopAppBar';

export const AdministrationScreen = observer(function AdministrationScreen() {
  const administrationScreenService = useService(AdministrationScreenService);
  if (!usePermission(EAdminPermission.admin)) {
    return <Translate token='root_permission_denied'/>;
  }

  const handleSelect = useCallback(
    (item: string) => administrationScreenService.navigateToItem(item),
    [administrationScreenService]
  );

  return (
    <>
      <AdministrationTopAppBar />
      <Administration
        activeItem={administrationScreenService.activeItem}
        activeItemSub={administrationScreenService.activeItemSub}
        activeItemSubParam={administrationScreenService.activeItemSubParam}
        onItemSelect={handleSelect}
      />
    </>
  );
});
