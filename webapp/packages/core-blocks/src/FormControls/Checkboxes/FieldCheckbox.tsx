/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { use } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { baseFormControlStyles } from '../baseFormControlStyles';
import { Checkbox } from './Checkbox';
import { CheckboxType, CheckboxControlledProps, CheckboxObjectProps} from './Checkbox';


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

  return styled(useStyles(baseFormControlStyles))(
    <field as="div" className={className} {...use({ long })}>
      <field-label as="div">{children}</field-label>
      <Checkbox
        {...rest}
        name={name}
        id={value || name}
        checked={checkedControlled}
        checkboxLabel={checkboxLabel}
        state={state}
        className={className}
        onChange={onChange}
        {...use({ mod })}
      />
    </field>
  );
};