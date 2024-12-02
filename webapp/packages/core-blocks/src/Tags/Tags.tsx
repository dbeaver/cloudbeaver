/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s } from '../s.js';
import { useS } from '../useS.js';
import style from './Tags.module.css';

interface Props {
  className?: string;
}

export const Tags = observer<React.PropsWithChildren<Props>>(function Tags({ children, className }) {
  const styles = useS(style);

  return <ul className={s(styles, { tags: true }, className)}>{children}</ul>;
});
