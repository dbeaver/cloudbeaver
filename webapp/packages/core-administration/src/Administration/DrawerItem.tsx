/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';

import { useService } from '@cloudbeaver/core-di';

import { AdministrationItemDrawerProps } from '../AdministrationItem/IAdministrationItem';
import { ConfigurationWizardService } from '../AdministrationScreen/ConfigurationWizard/ConfigurationWizardService';

export const DrawerItem = observer(function DrawerItem({
  item, onSelect, style, configurationWizard,
}: AdministrationItemDrawerProps) {
  const configurationWizardService = useService(ConfigurationWizardService);
  const Component = item.getDrawerComponent();

  const disabled = configurationWizard && !configurationWizardService.isStepAvailable(item.name);

  return <Component
    item={item}
    onSelect={onSelect}
    configurationWizard={configurationWizard}
    style={style}
    disabled={disabled}
  />;
});
