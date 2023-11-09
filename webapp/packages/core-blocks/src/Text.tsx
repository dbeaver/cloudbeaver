/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s } from './s';
import classes from './Text.m.css';
import { useS } from './useS';

interface Props extends React.HTMLAttributes<HTMLParagraphElement> {}

export const Text: React.FC<Props> = observer(function Text({ children, ...rest }) {
  const styles = useS(classes);

  return (
    <p {...rest} className={s(styles, { paragraph: true }, rest.className)}>
      {children}
    </p>
  );
});
