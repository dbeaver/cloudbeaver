/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css, use } from 'reshadow';

import {
  ObjectPropertyCheckbox,
  ObjectPropertyInput,
  ObjectPropertyProps,
} from '../formControls';
import { filterProperty, matchType } from '../helpers';

const propertyStyles = css`
  property {
    composes: theme-typography--body2 from global;
    display: flex;
    box-sizing: border-box;
    padding: 8px 8px;
    width: 600px;
  }
`;

export const ObjectProperty = observer(function ObjectProperty({
  objectProperty,
  className,
}: ObjectPropertyProps) {
  if (!objectProperty || !filterProperty(objectProperty)) {
    return null;
  }

  return styled(propertyStyles)(
    <property
      className={className}
      as="div"
      {...use({ checkbox: matchType(objectProperty.dataType) === 'checkbox' })}
    >
      {matchType(objectProperty.dataType) === 'checkbox'
        ? <ObjectPropertyCheckbox objectProperty={objectProperty}/>
        : <ObjectPropertyInput objectProperty={objectProperty}/>}
    </property>
  );
});
