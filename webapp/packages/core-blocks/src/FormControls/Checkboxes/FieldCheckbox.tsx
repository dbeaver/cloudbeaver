/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { getLayoutProps } from '../../Containers/filterLayoutFakeProps';
import elementsSizeStyles from '../../Containers/shared/ElementsSize.m.css';
import { s } from '../../s';
import { useS } from '../../useS';
import formControlStyles from '../FormControl.m.css';
import { isControlPresented } from '../isControlPresented';
import { Checkbox, CheckboxBaseProps, CheckboxType, ICheckboxControlledProps, ICheckboxObjectProps } from './Checkbox';
import fieldCheckboxStyles from './FieldCheckbox.m.css';

export const FieldCheckbox: CheckboxType = function FieldCheckbox({
  children,
  className,
  ...rest
}: CheckboxBaseProps & (ICheckboxControlledProps | ICheckboxObjectProps<any>)) {
  const layoutProps = getLayoutProps(rest);
  const styles = useS(elementsSizeStyles, formControlStyles, fieldCheckboxStyles);

  if (rest.autoHide && !isControlPresented(rest.name, rest.state)) {
    return null;
  }

  return (
    <div data-testid="field" className={s(styles, { field: true, ...layoutProps }, className)}>
      <Checkbox {...(rest as CheckboxBaseProps & ICheckboxControlledProps)} className={styles.checkbox} />
      <label data-testid="field-label" htmlFor={rest.id || rest.name} title={rest.title} className={styles.fieldLabel}>
        {children}
      </label>
    </div>
  );
};
