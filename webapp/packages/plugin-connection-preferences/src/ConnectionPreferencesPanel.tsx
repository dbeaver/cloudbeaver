/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';

import { ColoredContainer, Loader } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { ConnectionPreferencesPanelService } from './ConnectionPreferencesPanelService.js';
import { ConnectionPreferencesFormLoader } from './ConnectionPreferencesForm/ConnectionPreferencesFormLoader.js';

export const ConnectionPreferencesPanel: React.FC = observer(function ConnectionPreferencesPanel() {
  const service = useService(ConnectionPreferencesPanelService);

  const close = useCallback(() => service.close(), [service]);

  return (
    <ColoredContainer className='tw:h-full'>
      <Loader suspense>
        {service.formState && <ConnectionPreferencesFormLoader formState={service.formState} onCancel={close} />}
      </Loader>
    </ColoredContainer>
  );
});
