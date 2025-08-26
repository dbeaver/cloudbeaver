/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useTranslate, Group, Placeholder, GroupTitle } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { observer } from 'mobx-react-lite';
import { OptionsExtendedService } from './OptionsExtendedService.js';
import type { IFormState } from '@cloudbeaver/core-ui';
import type { IConnectionFormState } from '../../IConnectionFormState.js';

export const OptionsExtendedForm = observer(function OptionsExtendedForm({ formState }: { formState: IFormState<IConnectionFormState> }) {
  const translate = useTranslate();
  const optionsExtendedService = useService(OptionsExtendedService);

  return (
    <Group form gap>
      <GroupTitle>{translate('Extended settings')}</GroupTitle>
      <Placeholder container={optionsExtendedService.container} formState={formState} />
    </Group>
  );
});
