/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { useService } from '@cloudbeaver/core-di';

import { filterOnlyActive } from '../AdministrationItem/AdministrationItemService';
import type { AdministrationItemDrawerProps } from '../AdministrationItem/IAdministrationItem';
import { ConfigurationWizardService } from '../AdministrationScreen/ConfigurationWizard/ConfigurationWizardService';

export const DrawerItem = observer<AdministrationItemDrawerProps>(function DrawerItem({
  item, onSelect, style, configurationWizard, disabled,
}) {
  const configurationWizardService = useService(ConfigurationWizardService);
  const Component = item.getDrawerComponent();

  if (configurationWizard) {
    disabled = !configurationWizardService.isStepAvailable(item.name);
  }

  const onlyActive = filterOnlyActive(configurationWizard)(item) ? false : disabled;

  return (
    <Component
      item={item}
      configurationWizard={configurationWizard}
      style={style}
      disabled={onlyActive}
      onSelect={onSelect}
    />
  );
});
