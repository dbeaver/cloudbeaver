/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s, StaticImage, useS } from '@cloudbeaver/core-blocks';
import type { DBObject } from '@cloudbeaver/core-navigation-tree';
import type { RenderCellProps } from '@cloudbeaver/plugin-data-grid';
import { useNode } from '@cloudbeaver/plugin-navigation-tree';

import style from './IconFormatter.module.css';

export const IconFormatter = observer<RenderCellProps<DBObject>>(function IconFormatter(props) {
  const { node } = useNode(props.row.id);
  const styles = useS(style);

  return (
    <div className={s(styles, { icon: true })}>{node?.icon && <StaticImage icon={node.icon} className={s(styles, { staticImage: true })} />}</div>
  );
});
