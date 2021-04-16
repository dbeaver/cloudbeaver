/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css, use } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { baseFormControlStylesNew } from '../baseFormControlStylesNew';
import { isControlPresented } from '../isControlPresented';
import { Checkbox, CheckboxBaseProps, CheckboxType, ICheckboxControlledProps, ICheckboxObjectProps } from './Checkbox';

const fieldCheckboxStyles = css`
  Checkbox {
    margin: -10px;
  }
  field {
    display: flex;
    align-items: flex-end;
    white-space: pre-wrap;
    &[|layout='mixedControls'] layout {
      /* same as input height */
      height: 32px;
    }
  }
  layout {
    display: flex;
    align-items: center;
  }
  field-label {
    composes: theme-typography--body2 from global;
    cursor: pointer;
    user-select: none;
    padding-left: 10px;
    line-height: 16px;
  }
`;

export const FieldCheckboxNew: CheckboxType = function FieldCheckboxNew({
  children,
  className,
  layout,
  ...rest
}: CheckboxBaseProps & (ICheckboxControlledProps | ICheckboxObjectProps<any>)) {
  const styles = useStyles(baseFormControlStylesNew, fieldCheckboxStyles);

  if (rest.autoHide && !isControlPresented(rest.name, rest.state)) {
    return null;
  }

  return styled(styles)(
    <field className={className} as="div" {...use({ layout })}>
      <layout as='div'>
        <Checkbox {...(rest as CheckboxBaseProps & ICheckboxControlledProps)} />
        <field-label htmlFor={rest.value || rest.name} title={rest.title} as="label">{children}</field-label>
      </layout>
    </field>
  );
};
