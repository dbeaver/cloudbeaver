/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import type { HTMLAttributes, PropsWithChildren } from 'react';

import { filterLayoutFakeProps, getLayoutProps } from '../Containers/filterLayoutFakeProps.js';
import type { ILayoutSizeProps } from '../Containers/ILayoutSizeProps.js';
import elementsSizeStyles from '../Containers/shared/ElementsSize.module.css';
import { s } from '../s.js';
import { useS } from '../useS.js';
import fieldStyles from './Field.module.css';

type Props = ILayoutSizeProps &
  HTMLAttributes<HTMLDivElement> & {
    className?: string;
  };
export const Field: React.FC<PropsWithChildren<Props>> = observer(function Field({ children, className, ...rest }) {
  const styles = useS(fieldStyles, elementsSizeStyles);
  const layoutProps = getLayoutProps(rest);
  rest = filterLayoutFakeProps(rest);

  return (
    <div {...rest} className={s(styles, { ...layoutProps, field: true }, className)}>
      {children}
    </div>
  );
});
