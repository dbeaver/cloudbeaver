/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Group } from '@cloudbeaver/core-blocks';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import { AIProfileCredentialsFields as CredentialsFields } from '@cloudbeaver/plugin-ai-profiles';

import type { IAIProfileCredentialsFormProps } from '../AIProfileCredentialsForm/IAIProfileCredentialsFormProps.js';

export const AIProfileCredentialsFields: TabContainerPanelComponent<IAIProfileCredentialsFormProps> = observer(function AIProfileCredentialsFields({
  formState,
}) {
  return (
    <Group className="tw:w-full" small keepSize gap>
      <CredentialsFields formState={formState} />
    </Group>
  );
});
