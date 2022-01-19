/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { Checkbox } from '@cloudbeaver/core-blocks';
import { useStyles } from '@cloudbeaver/core-theming';

import { additionalProps, getValue, matchType } from '../helpers';
import type { ObjectPropertyProps } from './ObjectPropertyProps';

const styles = css`
  form-checkbox {
    display: flex;
    width: 100%;
  }
  label-wrapper {
    padding-right: 8px;
    box-sizing: border-box;
    width: 25%;
  }
  input-wrapper {
    padding-left: 8px;
    box-sizing: border-box;
    width: 24px;
  }
  input {
    font-size: 13px;
    line-height: 24px;
  }
  label {
    text-align: right;
    font-size: 13px;
    line-height: 26px;
  }
  Checkbox {
    margin: -10px;
  }
`;

export const ObjectPropertyCheckbox = observer<ObjectPropertyProps>(function ObjectPropertyCheckbox({
  objectProperty,
}) {
  const style = useStyles(styles);
  if (!objectProperty) {
    return null;
  }

  return styled(style)(
    <form-checkbox as="div">
      <label-wrapper as="div">
        <label htmlFor={objectProperty.id} title={objectProperty.displayName}>{objectProperty.displayName}</label>
      </label-wrapper>
      <input-wrapper as="div">
        {matchType(objectProperty.dataType) === 'checkbox' ? (
          <Checkbox
            value={getValue(objectProperty.value as any)}
            {...additionalProps(objectProperty)}
            readOnly
          />
        ) : (
          <input
            type={matchType(objectProperty.dataType)}
            value={getValue(objectProperty.value as any)}
            {...additionalProps(objectProperty)}
            readOnly
          />
        )}
      </input-wrapper>
    </form-checkbox>
  );
});
