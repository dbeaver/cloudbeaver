/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { filterLayoutFakeProps, getLayoutProps } from '../../Containers/filterLayoutFakeProps';
import type { ILayoutSizeProps } from '../../Containers/ILayoutSizeProps';
import { s } from '../../s';
import { useS } from '../../useS';
import { Field } from '../Field';
import { FieldLabel } from '../FieldLabel';
import { isControlPresented } from '../isControlPresented';
import { Checkbox, CheckboxBaseProps, CheckboxType, ICheckboxControlledProps, ICheckboxObjectProps } from './Checkbox';
import fieldCheckboxStyles from './FieldCheckbox.m.css';

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
