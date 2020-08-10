/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css, use } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { baseFormControlStyles } from './baseFormControlStyles';

const styles = css`
  textarea {
    line-height: 19px;
  }
`;

type Props = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> & {
  mod?: 'surface';
  onChange?(value: string): any;
}

export function Textarea({
  children,
  className,
  mod,
  onChange = () => {},
  ...rest
}: Props) {

  return styled(useStyles(baseFormControlStyles, styles))(
    <field as="div" className={className}>
      <field-label as='label'>{children}</field-label>
      <textarea onChange={e => onChange(e.target.value)} {...rest} {...use({ mod })} />
    </field>
  );
}
