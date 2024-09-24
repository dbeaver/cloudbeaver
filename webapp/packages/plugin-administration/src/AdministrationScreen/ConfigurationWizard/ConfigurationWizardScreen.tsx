/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';

import { AdministrationItemService, AdministrationScreenService } from '@cloudbeaver/core-administration';
import { Translate, usePermission, useResource } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { EAdminPermission, SessionPermissionsResource } from '@cloudbeaver/core-root';

import { Administration } from '../../Administration/Administration.js';
import { WizardStepper } from './WizardStepper.js';
import { WizardTopAppBar } from './WizardTopAppBar/WizardTopAppBar.js';

export const ConfigurationWizardScreen = observer(function ConfigurationWizardScreen() {
  useResource(ConfigurationWizardScreen, SessionPermissionsResource, undefined);
  const administrationItemService = useService(AdministrationItemService);
  const administrationScreenService = useService(AdministrationScreenService);

  const handleSelect = useCallback(
    (item: string) => {
      const route = administrationItemService.getItem(item, true)?.configurationWizardOptions?.defaultRoute;
      administrationScreenService.navigateTo(item, route);
    },
    [administrationItemService, administrationScreenService],
  );

  if (!usePermission(EAdminPermission.admin)) {
    return <Translate token="root_permission_denied" />;
  }

  return (
    <>
      <WizardTopAppBar />
      <Administration activeScreen={administrationScreenService.activeScreen} configurationWizard onItemSelect={handleSelect}>
        <WizardStepper />
      </Administration>
    </>
  );
});
