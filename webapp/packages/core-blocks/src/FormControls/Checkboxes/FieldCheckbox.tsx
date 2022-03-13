/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { baseFormControlStyles, baseValidFormControlStyles } from '../baseFormControlStyles';
import { isControlPresented } from '../isControlPresented';
import { Checkbox, CheckboxBaseProps, CheckboxType, ICheckboxControlledProps, ICheckboxObjectProps } from './Checkbox';

const style = css`
  Checkbox {
    margin: -10px;
  }
  field {
    display: flex;
    align-items: center;
    white-space: pre-wrap;

    & field-label {
      cursor: pointer;
      user-select: none;
      padding-left: 10px;
      line-height: 16px;
    }
  }
  field-label {
      composes: theme-typography--body2 from global;
  }
  Checkbox[disabled] + field-label {
    cursor: auto;
  }
`;

export const FieldCheckbox: CheckboxType = function FieldCheckbox({
  children,
  className,
  ...rest
}: CheckboxBaseProps & (ICheckboxControlledProps | ICheckboxObjectProps<any>)) {
  const styles = useStyles(baseFormControlStyles, baseValidFormControlStyles, style);

  if (rest.autoHide && !isControlPresented(rest.name, rest.state)) {
    return null;
  }

  return styled(styles)(
    <field className={className}>
      <Checkbox {...(rest as CheckboxBaseProps & ICheckboxControlledProps)} />
      <field-label
        htmlFor={rest.id || rest.name}
        title={rest.title}
        as="label"
      >
        {children}
      </field-label>
    </field>
  );
};
