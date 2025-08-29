/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Placeholder } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { observer } from 'mobx-react-lite';
import { ProviderPropertiesExtendedService } from './ProviderPropertiesExtendedService.js';
import type { IFormState } from '@cloudbeaver/core-ui';
import type { IConnectionFormState } from '../IConnectionFormState.js';

export const ProviderPropertiesExtendedForm = observer(function OptionsExtendedForm({ formState }: { formState: IFormState<IConnectionFormState> }) {
  const providerPropertiesExtendedService = useService(ProviderPropertiesExtendedService);

  return <Placeholder container={providerPropertiesExtendedService.container} formState={formState} />;
});
