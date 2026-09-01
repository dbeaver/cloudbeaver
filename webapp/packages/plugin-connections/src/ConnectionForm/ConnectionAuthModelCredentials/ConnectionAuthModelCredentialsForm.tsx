/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { ObjectPropertyInfoForm, type ILayoutSizeProps } from '@cloudbeaver/core-blocks';
import { getObjectPropertyType, type IObjectPropertyInfo } from '@cloudbeaver/core-sdk';

interface Props {
  credentials?: Record<string, any>;
  defaultCredentials?: Record<string, any>;
  properties: ReadonlyArray<IObjectPropertyInfo>;
  readonly?: boolean;
  disabled?: boolean;
}

export const ConnectionAuthModelCredentialsForm = observer<Props>(function ConnectionAuthModelCredentialsForm({
  credentials,
  defaultCredentials,
  properties,
  readonly,
  disabled,
}) {
  if (properties.length === 0) {
    return null;
  }

  function getLayoutSize(property: IObjectPropertyInfo): ILayoutSizeProps {
    const type = getObjectPropertyType(property);

    if (type === 'checkbox') {
      return {};
    }

    return {
      fill: true,
    };
  }

  return (
    <ObjectPropertyInfoForm
      autocompleteSectionName="section-connection-authentication"
      properties={properties}
      state={credentials}
      defaultState={defaultCredentials}
      disabled={disabled}
      readOnly={readonly}
      getLayoutSize={getLayoutSize}
      autocompletePasswordType="new-password"
      showRememberTip
      hideEmptyPlaceholder
    />
  );
});
