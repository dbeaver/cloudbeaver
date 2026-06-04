/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { CheckboxIndicator as UiKitCheckboxIndicator, type CheckboxIndicatorProps as UiKitCheckboxIndicatorProps } from '@dbeaver/ui-kit';
import { useS } from '../../useS.js';
import { s } from '../../s.js';
import './CheckboxMarkup.css';
import CheckboxMarkupStyles from './CheckboxMarkup.module.css';
import type { JSX } from 'react';

interface ICheckboxIndicatorProps extends UiKitCheckboxIndicatorProps {
  theme?: 'primary' | 'secondary' | 'tertiary';
}

export function CheckboxIndicator({ theme = 'primary', className, ...rest }: ICheckboxIndicatorProps): JSX.Element {
  const styles = useS(CheckboxMarkupStyles);

  return (
    <span className={s(styles, { container: true }, 'checkbox-markup', `checkbox-markup-theme--${theme}`)}>
      <UiKitCheckboxIndicator className={className} {...rest} />
    </span>
  );
}
