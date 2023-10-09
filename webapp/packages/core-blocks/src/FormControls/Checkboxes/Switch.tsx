/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { filterLayoutFakeProps } from '../../Containers/filterLayoutFakeProps';
import elementsSizeStyles from '../../Containers/shared/ElementsSize.m.css';
import { s } from '../../s';
import { useS } from '../../useS';
import formControlStyles from '../FormControl.m.css';
import { isControlPresented } from '../isControlPresented';
import type { ICheckboxControlledProps, ICheckboxObjectProps } from './Checkbox';
import switchStyles from './Switch.m.css';
import denseModStyles from './SwitchDense.m.css';
import primaryModStyles from './SwitchPrimary.m.css';
import { useCheckboxState } from './useCheckboxState';

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
  (props: IBaseProps & ICheckboxControlledProps): React.ReactNode;
  <TKey extends string>(props: IBaseProps & ICheckboxObjectProps<TKey>): React.ReactNode;
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
}: IBaseProps & (ICheckboxControlledProps | ICheckboxObjectProps<any>)) {
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
  const styles = useS(elementsSizeStyles, formControlStyles, switchStyles, ...mod.map(mod => switchMod[mod]));

  if (autoHide && !isControlPresented(name, state)) {
    return null;
  }

  return (
    <div data-testid="field" className={s(styles, { field: true }, className)} title={rest.title}>
      <div data-testid="switch-body" className={styles.switchBody}>
        <div data-testid="switch-control" className={s(styles, { switchControl: true, disabled: disabled, checked: checkboxState.checked })}>
          <div data-testid="switch-control-track" className={styles.switchControlTrack} />
          <div data-testid="switch-control-underlay" className={styles.switchControlUnderlay}>
            <div data-testid="switch-control-thumb" className={styles.switchControlThumb} />
            <input
              {...rest}
              type="checkbox"
              id={id || value || name}
              role="switch"
              aria-checked={checkboxState.checked}
              checked={checkboxState.checked}
              disabled={disabled}
              data-testid="switch-input"
              className={styles.switchInput}
              onChange={checkboxState.change}
            />
          </div>
        </div>
        <label htmlFor={id || value || name} data-testid="field-label" className={styles.fieldLabel}>
          {children}
        </label>
      </div>
      {description && (
        <div data-testid="field-description" className={styles.fieldDescription}>
          {description}
        </div>
      )}
    </div>
  );
});
