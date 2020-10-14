/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { use, css } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { baseFormControlStyles } from '../baseFormControlStyles';
import { Checkbox, CheckboxType, CheckboxControlledProps, CheckboxObjectProps } from './Checkbox';

const fieldCheckboxStyles = css`
  Checkbox {
    margin: -10px;
  }
`;

export const FieldCheckbox: CheckboxType = function FieldCheckbox({
  name,
  value,
  state,
  checkboxLabel,
  checked: checkedControlled,
  children,
  className,
  mod,
  long,
  onChange,
  ...rest
}: CheckboxControlledProps | CheckboxObjectProps<any, any>) {
  return styled(useStyles(baseFormControlStyles, fieldCheckboxStyles))(
    <field className={className} as="div" {...use({ long })}>
      <field-label as="div">{children}</field-label>
      <Checkbox
        {...rest}
        value={value}
        name={name}
        checked={checkedControlled}
        checkboxLabel={checkboxLabel}
        state={state}
        onChange={onChange}
        {...use({ mod })}
      />
    </field>
  );
};
