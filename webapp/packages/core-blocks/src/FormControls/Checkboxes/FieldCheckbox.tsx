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
import { isControlPresented } from '../isControlPresented';
import { Checkbox, CheckboxType, CheckboxControlledProps, CheckboxObjectProps } from './Checkbox';

const fieldCheckboxStyles = css`
  Checkbox {
    margin: -10px;
  }
`;

export const FieldCheckbox: CheckboxType = function FieldCheckbox({
  checked: checkedControlled,
  children,
  className,
  long,
  autoHide,
  ...rest
}: CheckboxControlledProps | CheckboxObjectProps<any, any>) {
  const styles = useStyles(baseFormControlStyles, fieldCheckboxStyles);

  if (autoHide && !isControlPresented(rest.name, rest.state)) {
    return null;
  }

  return styled(styles)(
    <field className={className} as="div" {...use({ long })}>
      <field-label as="div">{children}</field-label>
      <Checkbox
        {...rest}
        checked={checkedControlled}
      />
    </field>
  );
};
