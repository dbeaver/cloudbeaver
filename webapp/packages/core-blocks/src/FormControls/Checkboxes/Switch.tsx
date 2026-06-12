/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { clsx, Switch as SwitchBase } from '@dbeaver/ui-kit';

import { filterLayoutFakeProps } from '../../Containers/filterLayoutFakeProps.js';
import type { ILayoutSizeProps } from '../../Containers/ILayoutSizeProps.js';
import { Field } from '../Field.js';
import { FieldDescription } from '../FieldDescription.js';
import { isControlPresented } from '../isControlPresented.js';
import type { ICheckboxControlledProps, ICheckboxObjectProps } from './Checkbox.js';
import './Switch.css';
import { useCheckboxState } from './useCheckboxState.js';

interface IBaseProps {
  mod?: Array<'primary' | 'dense'>;
  description?: React.ReactNode;
  inverse?: boolean;
}

interface SwitchType {
  (props: IBaseProps & ICheckboxControlledProps & ILayoutSizeProps): React.ReactElement<any, any> | null;
  <TKey extends string>(props: IBaseProps & ICheckboxObjectProps<TKey> & ILayoutSizeProps): React.ReactElement<any, any> | null;
}

export const Switch: SwitchType = observer(function Switch({
  name,
  id,
  value,
  defaultValue,
  description,
  state,
  checked,
  defaultChecked,
  className,
  children,
  inverse,
  mod = [],
  autoHide,
  disabled,
  onChange,
  ...rest
}: IBaseProps & (ICheckboxControlledProps | ICheckboxObjectProps<any>) & ILayoutSizeProps) {
  const checkboxState = useCheckboxState({
    value,
    defaultValue,
    checked,
    defaultChecked,
    state,
    name,
    inverse,
    onChange,
  });
  rest = filterLayoutFakeProps(rest);

  if (autoHide && !isControlPresented(name, state)) {
    return null;
  }

  return (
    <Field title={rest.title} className={clsx('switch-field', className)}>
      <SwitchBase.Provider
        {...rest}
        id={id || value || name}
        checked={checkboxState.checked}
        disabled={disabled}
        className={clsx(
          'switch-body',
          mod.map(m => `switch-body--${String(m)}`),
        )}
        onChange={checkboxState.change}
      >
        <SwitchBase.Track />
        <SwitchBase.Input />
        <SwitchBase.Thumb />
        {children && (
          <SwitchBase.Label
            className={clsx(
              'switch-label',
              mod.includes('primary') && 'theme-typography--body1',
              mod.includes('dense') && 'theme-typography--body2',
              mod.map(m => `switch-label--${String(m)}`),
            )}
          >
            {children}
          </SwitchBase.Label>
        )}
      </SwitchBase.Provider>
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  );
});
