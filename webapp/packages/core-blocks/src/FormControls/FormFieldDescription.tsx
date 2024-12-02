/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { filterLayoutFakeProps, getLayoutProps } from '../Containers/filterLayoutFakeProps.js';
import type { ILayoutSizeProps } from '../Containers/ILayoutSizeProps.js';
import { s } from '../s.js';
import { useS } from '../useS.js';
import { Field } from './Field.js';
import { FieldDescription } from './FieldDescription.js';
import { FieldLabel } from './FieldLabel.js';
import style from './FormFieldDescription.module.css';

interface Props extends ILayoutSizeProps {
  label?: string;
  title?: string;
  content?: React.ReactNode;
  hidden?: boolean;
  className?: string;
}

export const FormFieldDescription: React.FC<React.PropsWithChildren<Props>> = function FormFieldDescription({
  label,
  title,
  content,
  children,
  className,
  ...rest
}) {
  const layoutProps = getLayoutProps(rest);
  rest = filterLayoutFakeProps(rest);
  const styles = useS(style);

  return (
    <Field title={title} className={className} {...rest} {...layoutProps}>
      {label && <FieldLabel className={s(styles, { fieldLabel: true })}>{label}</FieldLabel>}
      {content}
      <FieldDescription className={s(styles, { fieldDescription: true })}>{children}</FieldDescription>
    </Field>
  );
};
