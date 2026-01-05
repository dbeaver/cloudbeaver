/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Container, ObjectPropertyInfoForm, type ILayoutSizeProps } from '@cloudbeaver/core-blocks';
import { getObjectPropertyType, type ObjectPropertyInfo } from '@cloudbeaver/core-sdk';

interface Props {
  credentials?: Record<string, any>;
  defaultCredentials?: Record<string, any>;
  properties: ReadonlyArray<ObjectPropertyInfo>;
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
  function getLayoutSize(property: ObjectPropertyInfo): ILayoutSizeProps {
    const type = getObjectPropertyType(property);

    if (type === 'checkbox') {
      return {};
    }

    return {
      fill: true,
    };
  }

  return (
    <Container wrap gap hideEmpty>
      <ObjectPropertyInfoForm
        autocompleteSectionName="section-connection-authentication"
        properties={properties}
        state={credentials}
        defaultState={defaultCredentials}
        disabled={disabled}
        readOnly={readonly}
        getLayoutSize={getLayoutSize}
        showRememberTip
        hideEmptyPlaceholder
      />
    </Container>
  );
});
