/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useLayoutEffect, useRef } from 'react';

import { s } from '../../s.js';
import { useS } from '../../useS.js';
import CheckboxMarkupStyles from './CheckboxMarkup.module.css';

export type CheckboxMod = 'primary' | 'surface' | 'small';

interface ICheckboxMarkupProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'style'> {
  label?: string;
  caption?: string;
  indeterminate?: boolean;
  ripple?: boolean;
  mod?: CheckboxMod[];
}

export { CheckboxMarkupStyles };

export const CheckboxMarkup: React.FC<ICheckboxMarkupProps> = function CheckboxMarkup({
  id,
  label,
  indeterminate,
  className,
  title,
  mod = ['primary'],
  ripple = true,
  readOnly,
  caption,
  ...rest
}) {
  const styles = useS(CheckboxMarkupStyles);
  const checkboxRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate || false;
    }
  });

  return (
    <div className={s(styles, { checkboxContainer: true, small: mod.includes('small') }, className)} title={title}>
      <div
        className={s(styles, {
          checkbox: true,
          disabled: rest.disabled,
          checked: rest.checked,
          primary: mod.includes('primary'),
          surface: mod.includes('surface'),
          small: mod.includes('small'),
        })}
      >
        <input
          ref={checkboxRef}
          className={s(styles, { checkboxInput: true })}
          type="checkbox"
          {...rest}
          disabled={rest.disabled || readOnly}
          id={id || rest.name}
        />
        <div className={s(styles, { checkboxBackground: true })}>
          <svg className={s(styles, { checkboxCheckmark: true })} viewBox="0 0 24 24">
            <path className={s(styles, { checkboxCheckmarkPath: true })} fill="none" d="M1.73,12.91 8.1,19.28 22.79,4.59" />
          </svg>
          <div className={s(styles, { checkboxMixedmark: true })} />
        </div>
        {ripple && <div className={s(styles, { checkboxRipple: true })} />}
      </div>
      {label && (id || rest.name) && (
        <label className={s(styles, { checkboxLabel: true })} htmlFor={id || rest.name}>
          {label}
          {caption && <div className={s(styles, { checkboxCaption: true })}>{caption}</div>}
        </label>
      )}
    </div>
  );
};
