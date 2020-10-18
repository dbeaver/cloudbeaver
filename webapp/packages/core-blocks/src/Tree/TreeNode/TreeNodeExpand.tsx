/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useContext } from 'react';
import styled from 'reshadow';
import { css } from 'reshadow';

import { Icon, Loader } from '@cloudbeaver/core-blocks';

import { TreeNodeContext } from './TreeNodeContext';

const styles = css`
  Icon {
    cursor: pointer;
    height: 100%;
    width: 100%;
  }
`;

interface Props {
  className?: string;
}

export const TreeNodeExpand: React.FC<Props> = observer(function TreeNodeExpand({
  className,
}) {
  const context = useContext(TreeNodeContext);

  if (!context) {
    throw new Error('Context not provided');
  }

  const handleExpand = (event: React.MouseEvent<HTMLDivElement>) => {
    context.expand();
  };

  const preventDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.preventDefault();
  };

  return styled(styles)(
    <arrow as="div" className={className} onClick={handleExpand} onDoubleClick={preventDoubleClick}>
      {context.loading && <Loader small />}
      {!context.loading && !context.leaf && <Icon name="arrow" viewBox="0 0 16 16" />}
    </arrow>
  );
});
