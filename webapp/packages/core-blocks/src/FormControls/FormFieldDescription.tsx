/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import styled, { css } from 'reshadow';

import { filterLayoutFakeProps, getLayoutProps } from '../Containers/filterLayoutFakeProps';
import type { ILayoutSizeProps } from '../Containers/ILayoutSizeProps';
import elementsSizeStyles from '../Containers/shared/ElementsSize.m.css';
import { s } from '../s';
import { useS } from '../useS';
import { useStyles } from '../useStyles';
import { baseFormControlStyles, baseValidFormControlStyles } from './baseFormControlStyles';

const style = css`
  field-label {
    composes: theme-typography--body1 from global;
    font-weight: 500;
    padding-bottom: 10px;
  }
  field-description {
    padding: 0;
  }
`;

interface Props extends ILayoutSizeProps {
  label?: string;
  title?: string;
  className?: string;
}

export const FormFieldDescription: React.FC<React.PropsWithChildren<Props>> = function FormFieldDescription({
  label,
  title,
  children,
  className,
  ...rest
}) {
  const layoutProps = getLayoutProps(rest);
  rest = filterLayoutFakeProps(rest);
  const styles = useStyles(baseFormControlStyles, baseValidFormControlStyles, style);
  const sizeStyles = useS(elementsSizeStyles);

  return styled(styles)(
    <field title={title} className={s(sizeStyles, { ...layoutProps }, className)} {...rest}>
      {label && <field-label as="label">{label}</field-label>}
      <field-description>{children}</field-description>
    </field>,
  );
};
