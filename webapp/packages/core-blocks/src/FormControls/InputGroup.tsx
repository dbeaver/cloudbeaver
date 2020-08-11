/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { use, css } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { baseFormControlStyles } from './baseFormControlStyles';

const styles = css`
  field-label {
    composes: theme-typography--body2 from global;
    margin-left: 150px;
    text-align: left;
    font-weight: initial;
  }
`;

type Props = React.PropsWithChildren<{
  className?: string;
}>

export function InputGroup({
  children,
  className,
}: Props) {

  return styled(useStyles(baseFormControlStyles, styles))(
    <field as="div" className={className}>
      <field-label as='label'>{children}</field-label>
    </field>
  );
}
