/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { use } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { baseFormControlStyles } from './baseFormControlStyles';

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  mod?: 'surface';
  onChange?(value: string): any;
}

export function InputField({
  children,
  className,
  mod,
  onChange = () => {},
  ...rest
}: Props) {

  return styled(useStyles(baseFormControlStyles))(
    <field as="div" className={className}>
      <field-label as='label'>{children}</field-label>
      <input onChange={e => onChange(e.target.value)} {...rest} {...use({ mod })} />
    </field>
  );
}
