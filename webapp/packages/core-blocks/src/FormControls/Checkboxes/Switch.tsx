/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { filterLayoutFakeProps } from '../../Containers/filterLayoutFakeProps.js';
import type { ILayoutSizeProps } from '../../Containers/ILayoutSizeProps.js';
import { s } from '../../s.js';
import { useS } from '../../useS.js';
import { Field } from '../Field.js';
import { FieldDescription } from '../FieldDescription.js';
import { FieldLabel } from '../FieldLabel.js';
import { isControlPresented } from '../isControlPresented.js';
import type { ICheckboxControlledProps, ICheckboxObjectProps } from './Checkbox.js';
import switchStyles from './Switch.module.css';
import denseModStyles from './SwitchDense.module.css';
import primaryModStyles from './SwitchPrimary.module.css';
import { useCheckboxState } from './useCheckboxState.js';

const switchMod = {
  primary: primaryModStyles,
  dense: denseModStyles,
};

interface IBaseProps {
  mod?: Array<keyof typeof switchMod>;
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
  const styles = useS(switchStyles, ...mod.map(mod => switchMod[mod]));

  if (autoHide && !isControlPresented(name, state)) {
    return null;
  }

  return (
    <Field title={rest.title}>
      <div className={styles['switchBody']}>
        <div className={s(styles, { switchControl: true, disabled: disabled, checked: checkboxState.checked })}>
          <div className={styles['switchControlTrack']} />
          <div className={styles['switchControlUnderlay']}>
            <div className={styles['switchControlThumb']} />
            <input
              {...rest}
              type="checkbox"
              id={id || value || name}
              role="switch"
              aria-checked={checkboxState.checked}
              checked={checkboxState.checked}
              disabled={disabled}
              className={styles['switchInput']}
              onChange={checkboxState.change}
            />
          </div>
        </div>
        <FieldLabel htmlFor={id || value || name} className={styles['fieldLabel']}>
          {children}
        </FieldLabel>
      </div>
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  );
});
