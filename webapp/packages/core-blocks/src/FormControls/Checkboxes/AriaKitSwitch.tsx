/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import * as Ariakit from '@ariakit/react';
import { type ComponentPropsWithoutRef, forwardRef, type ReactNode, useState } from 'react';

import styles from './AriaKitSwitch.module.css';

interface CheckboxProps extends ComponentPropsWithoutRef<'input'> {
  children?: ReactNode;
}

export const AriaKitSwitch = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox({ children, ...props }, ref) {
  const [checked, setChecked] = useState(props.defaultChecked ?? false);
  const [focusVisible, setFocusVisible] = useState(false);
  return (
    <label className={styles['switchWrapper']} data-checked={checked} data-focus-visible={focusVisible || undefined}>
      <Ariakit.VisuallyHidden>
        <Ariakit.Checkbox
          {...props}
          ref={ref}
          clickOnEnter
          onFocusVisible={() => setFocusVisible(true)}
          onBlur={() => setFocusVisible(false)}
          onChange={event => {
            setChecked(event.target.checked);
            props.onChange?.(event);
          }}
        />
      </Ariakit.VisuallyHidden>
      <div className={styles['switch']} data-checked={checked}>
        <div className={styles['thumb']} data-checked={checked} />
      </div>
      <span className={styles['title']}> {children}</span>
    </label>
  );
});
