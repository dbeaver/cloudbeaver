/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { ConfigurationWizardService } from '@cloudbeaver/core-administration';
import { ColoredContainer, Form, useForm } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { Settings } from '@cloudbeaver/plugin-settings-panel';

import { ConfigurationSettingsService } from './ConfigurationSettingsService.js';

export const ConfigurationSettingsPage = observer(function ConfigurationSettingsPage() {
  const configurationSettingsService = useService(ConfigurationSettingsService);
  const configurationWizardService = useService(ConfigurationWizardService);
  const form = useForm({ onSubmit: () => configurationWizardService.next() });

  return (
    <Form context={form} contents>
      <ColoredContainer parent vertical noWrap overflow gap>
        <Settings source={configurationSettingsService} resolver={configurationSettingsService.resolver} accessor={['server']} />
      </ColoredContainer>
    </Form>
  );
});
