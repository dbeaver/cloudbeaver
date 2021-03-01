/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { baseFormControlStylesNew } from '../baseFormControlStylesNew';
import { isControlPresented } from '../isControlPresented';
import { Checkbox, CheckboxType, CheckboxControlledProps, CheckboxObjectProps } from './Checkbox';

const fieldCheckboxStyles = css`
  Checkbox {
    margin: -5px -10px;
  }
  field {
    display: flex;
    align-items: flex-end;
    white-space: pre-wrap;
  }
  field-label {
    padding-left: 10px;
  }
`;

export const FieldCheckboxNew: CheckboxType = function FieldCheckboxNew({
  checked: checkedControlled,
  children,
  className,
  autoHide,
  ...rest
}: CheckboxControlledProps | CheckboxObjectProps<any, any>) {
  const styles = useStyles(baseFormControlStylesNew, fieldCheckboxStyles);

  if (autoHide && !isControlPresented(rest.name, rest.state)) {
    return null;
  }

  return styled(styles)(
    <field className={className} as="div">
      <Checkbox
        {...rest}
        checked={checkedControlled}
      />
      <field-label as="div">{children}</field-label>
    </field>
  );
};
