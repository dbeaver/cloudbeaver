/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import styled from 'reshadow';
import { css } from 'reshadow';

import { Icon, Loader } from '@cloudbeaver/core-blocks';
import { EventContext } from '@cloudbeaver/core-events';

import { useStateDelay } from '../../useStateDelay';
import { EventTreeNodeExpandFlag } from './EventTreeNodeExpandFlag';
import { TreeNodeContext } from './TreeNodeContext';

const styles = css`
  Icon {
    cursor: pointer;
    height: 100%;
    width: 100%;
  }
`;

interface Props {
  leaf?: boolean;
  big?: boolean;
  className?: string;
}

export const TreeNodeExpand: React.FC<Props> = observer(function TreeNodeExpand({
  leaf,
  big,
  className,
}) {
  const context = useContext(TreeNodeContext);

  if (!context) {
    throw new Error('Context not provided');
  }

  const handleExpand = (event: React.MouseEvent<HTMLDivElement>) => {
    EventContext.set(event, EventTreeNodeExpandFlag);

    if (!context.leaf && !leaf) {
      context.expand();
    }
  };

  const handleDbClick = (event: React.MouseEvent<HTMLDivElement>) => {
    EventContext.set(event, EventTreeNodeExpandFlag);
  };

  const loading = useStateDelay(context.loading || context.processing, 300);

  return styled(styles)(
    <arrow className={className} onClick={handleExpand} onDoubleClick={handleDbClick}>
      {loading && <Loader small fullSize />}
      {!loading && !context.leaf && !leaf && big && <Icon name="angle" viewBox="0 0 15 8" />}
      {!loading && !context.leaf && !leaf && !big && <Icon name="arrow" viewBox="0 0 16 16" />}
    </arrow>
  );
});
