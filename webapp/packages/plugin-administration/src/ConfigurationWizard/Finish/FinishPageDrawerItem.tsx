/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import type { AdministrationItemDrawerProps } from '@cloudbeaver/core-administration';
import { Translate } from '@cloudbeaver/core-blocks';
import { TabIcon, Tab, TabTitle } from '@cloudbeaver/core-ui';

export const FinishPageDrawerItem = observer<AdministrationItemDrawerProps>(function FinishPageDrawerItem({ item, onSelect, disabled }) {
  return (
    <Tab tabId={item.name} disabled={disabled || item.configurationWizardOptions?.isDisabled?.()} onOpen={() => onSelect(item.name)}>
      <TabIcon icon="/icons/confirmation.svg" viewBox="0 0 16 16" />
      <TabTitle>
        <Translate token="administration_configuration_wizard_finish" />
      </TabTitle>
    </Tab>
  );
});
