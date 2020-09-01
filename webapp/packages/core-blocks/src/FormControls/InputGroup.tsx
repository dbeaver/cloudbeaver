/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css, use } from 'reshadow';

import { useStyles, composes } from '@cloudbeaver/core-theming';

import { baseFormControlStyles } from './baseFormControlStyles';

const styles = composes(
  css`
    field-label {
      composes: theme-border-color-background from global;
    }
  `,
  css`
    field-label {
      composes: theme-typography--body2 from global;
      margin-left: 150px;
      text-align: left;
      font-weight: initial;
      padding-bottom: 8px;
      border-bottom: solid 1px #dedede;
      width: 100%;

      &[|long] {
        margin-left: 200px;
      }
    }
  `
);
type Props = React.PropsWithChildren<{
  className?: string;
  long?: boolean;
}>

export function InputGroup({
  children,
  className,
  long,
}: Props) {

  return styled(useStyles(baseFormControlStyles, styles))(
    <field as="div" className={className}>
      <field-label as='label' {...use({ long })}>{children}</field-label>
    </field>
  );
}
