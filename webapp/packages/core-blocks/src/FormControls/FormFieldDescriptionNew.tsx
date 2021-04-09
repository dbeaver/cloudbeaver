/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled from 'reshadow';
import { css } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { baseFormControlStylesNew } from './baseFormControlStylesNew';

const formFieldDescriptionNewStyles = css`
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

export const FormFieldDescriptionNew: React.FC<Props> = function FormFieldDescriptionNew({
  label,
  title,
  children,
  className,
}) {
  const styles = useStyles(baseFormControlStylesNew, formFieldDescriptionNewStyles);

  return styled(styles)(
    <field title={title} as='div' className={className}>
      {label && <field-label as='label'>{label}</field-label>}
      <field-description as='div'>
        {children}
      </field-description>
    </field>
  );
};
