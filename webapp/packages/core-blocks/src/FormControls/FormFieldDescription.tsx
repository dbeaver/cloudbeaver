/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { filterLayoutFakeProps, getLayoutProps } from '../Containers/filterLayoutFakeProps';
import type { ILayoutSizeProps } from '../Containers/ILayoutSizeProps';
import elementsSizeStyles from '../Containers/shared/ElementsSize.m.css';
import { s } from '../s';
import { useS } from '../useS';
import formControlStyles from './FormControl.m.css';
import style from './FormFieldDescription.m.css';

interface Props extends ILayoutSizeProps {
  label?: string;
  title?: string;
  className?: string;
  children?: React.ReactNode;
}

export const FormFieldDescription = observer<Props>(function FormFieldDescription({ label, title, children, className, ...rest }) {
  const styles = useS(formControlStyles, elementsSizeStyles, style);
  const layoutProps = getLayoutProps(rest);
  rest = filterLayoutFakeProps(rest);

  return (
    <div title={title} className={s(styles, { ...layoutProps, field: true }, className)} {...rest}>
      {label && <label className={s(styles, { fieldLabel: true })}>{label}</label>}
      <div className={s(styles, { fieldDescription: true, valid: true })}>{children}</div>
    </div>
  );
});
