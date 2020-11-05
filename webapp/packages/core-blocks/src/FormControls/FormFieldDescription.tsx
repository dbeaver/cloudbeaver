/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { use } from 'reshadow';

import { baseFormControlStyles } from './baseFormControlStyles';

interface Props {
  label?: string;
  long?: boolean;
  short?: boolean;
  raw?: boolean;
  className?: string;
}

export const FormFieldDescription: React.FC<Props> = function FormFieldDescription({
  label,
  long,
  short,
  raw,
  children,
  className,
}) {
  return styled(baseFormControlStyles)(
    <field as='div' className={className} {...use({ long, short, raw })}>
      {label && <field-label as='label'>{label}</field-label>}
      <field-description as='div'>
        {children}
      </field-description>
    </field>
  );
};
