/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import style from './Code.module.css';
import { s } from './s';
import { useS } from './useS';

interface Props {
  className?: string;
  children?: React.ReactNode;
}

export const Code = observer<Props>(function Code({ children, className }) {
  const styles = useS(style);

  return (
    <div className={s(styles, { codeContainer: true }, className)}>
      <code>{children}</code>
    </div>
  );
});
