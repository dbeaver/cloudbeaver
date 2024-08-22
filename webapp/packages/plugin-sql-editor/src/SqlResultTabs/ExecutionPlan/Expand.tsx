/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Icon, s, useS } from '@cloudbeaver/core-blocks';

import classes from './Expand.module.css';

interface Props {
  expanded: boolean;
  className?: string;
  onClick: (event: React.MouseEvent<any>) => void;
}

export const Expand: React.FC<Props> = function Expand({ expanded, className, onClick }) {
  const styles = useS(classes);
  return <Icon className={s(styles, { icon: true, expanded }, className)} name="arrow" viewBox="0 0 16 16" onClick={onClick} />;
};
