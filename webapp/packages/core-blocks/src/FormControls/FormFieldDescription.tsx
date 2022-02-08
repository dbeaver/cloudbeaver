/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { baseFormControlStyles, baseValidFormControlStyles } from './baseFormControlStyles';

const style = css`
  field-label {
    composes: theme-typography--body1 from global;
    font-weight: 500;
  }
`;

interface Props {
  label?: string;
  title?: string;
  className?: string;
}

export const FormFieldDescription: React.FC<Props> = function FormFieldDescription({
  label,
  title,
  children,
  className,
}) {
  const styles = useStyles(baseFormControlStyles, baseValidFormControlStyles, style);

  return styled(styles)(
    <field title={title} className={className}>
      {label && <field-label as='label'>{label}</field-label>}
      <field-description>
        {children}
      </field-description>
    </field>
  );
};
