/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { CheckboxIndicator as UiKitCheckboxIndicator, type ICheckboxIndicatorProps as UiKitCheckboxIndicatorProps } from '@dbeaver/ui-kit';
import { useS } from '../../useS.js';
import { s } from '../../s.js';
import './CheckboxMarkup.css';
import CheckboxMarkupStyles from './CheckboxMarkup.module.css';
import type { JSX } from 'react';

interface Props extends UiKitCheckboxIndicatorProps {
  variant?: 'primary' | 'secondary' | 'tertiary';
}

export function CheckboxIndicator({ variant = 'primary', className, ...rest }: Props): JSX.Element {
  const styles = useS(CheckboxMarkupStyles);

  return (
    <span className={s(styles, { container: true }, 'checkbox-markup', `checkbox-markup-theme--${variant}`)}>
      <UiKitCheckboxIndicator className={className} {...rest} />
    </span>
  );
}
