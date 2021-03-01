/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled from 'reshadow';

import { baseFormControlStylesNew } from './baseFormControlStylesNew';

interface Props {
  label?: string;
  className?: string;
}

export const FormFieldDescriptionNew: React.FC<Props> = function FormFieldDescriptionNew({
  label,
  children,
  className,
}) {
  return styled(baseFormControlStylesNew)(
    <field as='div' className={className}>
      {label && <field-label as='label'>{label}</field-label>}
      <field-description as='div'>
        {children}
      </field-description>
    </field>
  );
};
