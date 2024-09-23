/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { FieldCheckbox, type ILayoutSizeProps, InputField } from '@cloudbeaver/core-blocks';
import type { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';

import { additionalProps, filterProperty, getValue, matchType } from '../../helpers.js';

interface Props extends ILayoutSizeProps {
  objectProperty?: ObjectPropertyInfo;
  className?: string;
}

export const ObjectProperty = observer<Props>(function ObjectProperty({ objectProperty, className }) {
  if (!objectProperty || !filterProperty(objectProperty)) {
    return null;
  }

  return (
    <>
      {matchType(objectProperty.dataType) === 'checkbox' ? (
        <FieldCheckbox
          className={className}
          title={objectProperty.description}
          name={objectProperty.id}
          value={getValue(objectProperty.value)}
          disabled
          {...additionalProps(objectProperty)}
        >
          {objectProperty.displayName}
        </FieldCheckbox>
      ) : (
        <InputField
          className={className}
          title={objectProperty.description}
          name={objectProperty.id}
          value={getValue(objectProperty.value)}
          readOnly
          {...additionalProps(objectProperty)}
        >
          {objectProperty.displayName}
        </InputField>
      )}
    </>
  );
});
