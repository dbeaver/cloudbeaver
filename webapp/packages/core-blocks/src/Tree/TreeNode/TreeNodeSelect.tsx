/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useContext } from 'react';
import styled from 'reshadow';
import { css } from 'reshadow';

import { Checkbox } from '../../FormControls/Checkboxes/Checkbox';
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

export const TreeNodeSelect: React.FC<Props> = function TreeNodeSelect({
  className,
}) {
  const context = useContext(TreeNodeContext);

  if (!context) {
    throw new Error('Context not provided');
  }

  const handleClick = (event: React.MouseEvent<HTMLInputElement>) => {
    event.stopPropagation();
  };

  const preventPropagation = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.preventDefault();
  };

  return styled(styles)(
    <div className={className} onClick={handleClick} onDoubleClick={preventPropagation}>
      <Checkbox checked={context.selected} onChange={() => context.select(true)} />
    </div>
  );
};
