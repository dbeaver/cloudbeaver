/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { baseFormControlStyles } from '../baseFormControlStyles';
import { isControlPresented } from '../isControlPresented';
import { Checkbox, CheckboxBaseProps, CheckboxType, ICheckboxControlledProps, ICheckboxObjectProps } from './Checkbox';

const fieldCheckboxStyles = css`
  Checkbox {
    margin: -10px;
  }
`;

export const FieldCheckbox: CheckboxType = function FieldCheckbox({
  children,
  className,
  ...rest
}: CheckboxBaseProps & (ICheckboxControlledProps | ICheckboxObjectProps<any>)) {
  const styles = useStyles(baseFormControlStyles, fieldCheckboxStyles);

  if (rest.autoHide && !isControlPresented(rest.name, rest.state)) {
    return null;
  }

  return styled(styles)(
    <field className={className} as="div">
      <field-label as="div">{children}</field-label>
      <Checkbox {...(rest as CheckboxBaseProps & ICheckboxControlledProps)} />
    </field>
  );
};
