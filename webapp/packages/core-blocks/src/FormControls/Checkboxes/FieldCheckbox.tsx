/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { filterLayoutFakeProps, getLayoutProps } from '../../Containers/filterLayoutFakeProps.js';
import type { ILayoutSizeProps } from '../../Containers/ILayoutSizeProps.js';
import { s } from '../../s.js';
import { useS } from '../../useS.js';
import { Field } from '../Field.js';
import { FieldLabel } from '../FieldLabel.js';
import { isControlPresented } from '../isControlPresented.js';
import { Checkbox, type CheckboxBaseProps, type CheckboxType, type ICheckboxControlledProps, type ICheckboxObjectProps } from './Checkbox.js';
import fieldCheckboxStyles from './FieldCheckbox.module.css';

export const FieldCheckbox: CheckboxType<ILayoutSizeProps> = observer(function FieldCheckbox({
  children,
  className,
  ...rest
}: CheckboxBaseProps & (ICheckboxControlledProps | ICheckboxObjectProps<any>) & ILayoutSizeProps) {
  const layoutProps = getLayoutProps(rest);
  const checkboxProps = filterLayoutFakeProps(rest) as CheckboxBaseProps & (ICheckboxControlledProps | ICheckboxObjectProps<any>);
  const styles = useS(fieldCheckboxStyles);

  if (checkboxProps.autoHide && !isControlPresented(checkboxProps.name, checkboxProps.state)) {
    return null;
  }

  return (
    <Field {...layoutProps} className={s(styles, { field: true }, className)}>
      <Checkbox {...(checkboxProps as any)} className={s(styles, { checkbox: true })} />
      {children && (
        <FieldLabel htmlFor={checkboxProps.id || checkboxProps.name} title={checkboxProps.title} className={s(styles, { fieldLabel: true })}>
          {children}
        </FieldLabel>
      )}
    </Field>
  );
});
