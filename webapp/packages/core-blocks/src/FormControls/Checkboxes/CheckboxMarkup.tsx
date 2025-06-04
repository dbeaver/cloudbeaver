/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Checkbox as UiKitCheckbox, clsx } from '@dbeaver/ui-kit';
import './CheckboxMarkup.css';
import type { ControlSize } from '@dbeaver/ui-kit/types/controls';

export type CheckboxMod = 'primary' | 'surface' | 'small';

interface ICheckboxMarkupProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'style' | 'size'> {
  label?: string;
  caption?: string;
  indeterminate?: boolean;
  size?: ControlSize;
  variant?: 'primary' | 'secondary';
}

export const CheckboxMarkup: React.FC<ICheckboxMarkupProps> = function CheckboxMarkup({
  id,
  label,
  indeterminate,
  className,
  caption,
  size = 'medium',
  variant = 'primary',
  title,
  readOnly,
  children,
  ...rest
}) {
  return (
    <div className={clsx('checkboxMarkup', `checkboxMarkup--${variant}`, className)} title={title}>
      <UiKitCheckbox id={id || rest.name} indeterminate={indeterminate} disabled={rest.disabled || readOnly} size={size} {...rest}>
        {label}
        {caption && <span className="checkboxCaption">{caption}</span>}
      </UiKitCheckbox>
    </div>
  );
};
