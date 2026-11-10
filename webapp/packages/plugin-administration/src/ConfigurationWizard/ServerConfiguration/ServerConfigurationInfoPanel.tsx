/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Container } from '@cloudbeaver/core-blocks';

import { ServerConfigurationInfoForm } from './Form/ServerConfigurationInfoForm.js';
import { getServerConfigurationFormPart } from './getServerConfigurationFormPart.js';
import type { ServerConfigurationFormProps } from './ServerConfigurationFormService.js';

export const ServerConfigurationInfoPanel = observer<ServerConfigurationFormProps>(function ServerConfigurationInfoPanel({
  formState,
  configurationWizard,
}) {
  const part = getServerConfigurationFormPart(formState);

  return (
    <Container wrap gap grid medium keepSize>
      <ServerConfigurationInfoForm state={part.state} formState={formState} configurationWizard={configurationWizard} />
    </Container>
  );
});
