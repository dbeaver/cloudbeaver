/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IObjectPropertyInfo } from '@cloudbeaver/core-sdk';
import { ObjectPropertyInfoForm } from '@cloudbeaver/core-blocks';

import type { IAIProfileOptionsState } from './AIProfileSchema.js';

interface AIProfilePropertiesFormProps {
  disabled: boolean;
  properties: ReadonlyArray<IObjectPropertyInfo>;
  state: IAIProfileOptionsState['properties'];
}

export function AIProfilePropertiesForm({ disabled, properties, state }: AIProfilePropertiesFormProps): React.JSX.Element {
  return (
    <ObjectPropertyInfoForm
      autocompleteSectionName="section-ai-profile"
      autocompletePasswordType="new-password"
      disabled={disabled}
      state={state}
      properties={properties}
      showRememberTip
      hideEmptyPlaceholder
      small
    />
  );
}
