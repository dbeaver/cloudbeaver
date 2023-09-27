/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { filterLayoutFakeProps } from '../Containers/filterLayoutFakeProps';
import type { ILayoutSizeProps } from '../Containers/ILayoutSizeProps';
import { s } from '../s';
import { useS } from '../useS';
import { Field } from './Field';
import { FieldDescription } from './FieldDescription';
import style from './FormFieldDescription.m.css';
import { FieldLabel } from './FieldLabel';

interface Props extends ILayoutSizeProps {
  label?: string;
  title?: string;
  className?: string;
}

export const FormFieldDescription: React.FC<React.PropsWithChildren<Props>> = observer(function FormFieldDescription({
  label,
  title,
  children,
  className,
  ...rest
}) {
  const styles = useS(style);
  rest = filterLayoutFakeProps(rest);

  return (
    <Field title={title} className={className} {...rest}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <FieldDescription className={s(styles, { fieldDescription: true })}>{children}</FieldDescription>
    </Field>
  );
});
