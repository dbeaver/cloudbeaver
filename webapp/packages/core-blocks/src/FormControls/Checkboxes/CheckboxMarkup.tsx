/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Checkbox as UiKitCheckbox } from '@dbeaver/ui-kit';
import type { ControlSize } from '@dbeaver/ui-kit/types/controls';
import { useS } from '../../useS.js';
import './CheckboxMarkup.css';
import CheckboxMarkupStyles from './CheckboxMarkup.module.css';
import { s } from '../../s.js';

export type CheckboxMod = 'primary' | 'surface' | 'small';

export { CheckboxMarkupStyles };

interface ICheckboxMarkupProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'style' | 'size'> {
  label?: string;
  caption?: string;
  indeterminate?: boolean;
  size?: ControlSize;
  theme?: 'primary' | 'secondary' | 'tertiary';
}

export const CheckboxMarkup: React.FC<ICheckboxMarkupProps> = function CheckboxMarkup({
  id,
  label,
  indeterminate,
  className,
  caption,
  size = 'medium',
  theme = 'primary',
  title,
  readOnly,
  children,
  ...rest
}) {
  const styles = useS(CheckboxMarkupStyles);

  return (
    <div className={s(styles, { container: true }, 'checkbox-markup', `checkbox-markup-theme--${theme}`, className)} title={title}>
      <UiKitCheckbox id={id || rest.name} indeterminate={indeterminate} disabled={rest.disabled || readOnly} size={size} {...rest}>
        {label && <span className={s(styles, { label: true }, 'checkbox-markup__label')}>{label}</span>}
        {caption && <span className={s(styles, { caption: true }, 'checkbox-markup__caption')}>{caption}</span>}
      </UiKitCheckbox>
    </div>
  );
};
