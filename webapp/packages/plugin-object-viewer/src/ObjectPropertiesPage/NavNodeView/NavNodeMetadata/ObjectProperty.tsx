/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { FieldCheckbox, type ILayoutSizeProps, InputField } from '@cloudbeaver/core-blocks';
import { getObjectPropertyType, getObjectPropertyValue, type ObjectPropertyInfo } from '@cloudbeaver/core-sdk';

interface Props extends ILayoutSizeProps {
  objectProperty?: ObjectPropertyInfo;
  className?: string;
}

export const ObjectProperty = observer<Props>(function ObjectProperty({ objectProperty, className }) {
  if (!objectProperty) {
    return null;
  }

  const type = getObjectPropertyType(objectProperty);
  const value = getObjectPropertyValue(objectProperty);

  if (type === 'checkbox') {
    return (
      <FieldCheckbox className={className} title={objectProperty.description} name={objectProperty.id} checked={value} disabled>
        {objectProperty.displayName}
      </FieldCheckbox>
    );
  }

  return (
    <InputField className={className} title={objectProperty.description} name={objectProperty.id} value={value} readOnly>
      {objectProperty.displayName}
    </InputField>
  );
});
