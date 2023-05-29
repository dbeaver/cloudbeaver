/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { StaticImage } from '@cloudbeaver/core-blocks';
import type { DBObject } from '@cloudbeaver/core-navigation-tree';
import { useNode } from '@cloudbeaver/plugin-navigation-tree';
import type { FormatterProps } from '@cloudbeaver/plugin-react-data-grid';

const styles = css`
  icon {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    & StaticImage {
      width: 16px;
    }
  }
`;

export const IconFormatter = observer<FormatterProps<DBObject>>(function IconFormatter(props) {
  const { node } = useNode(props.row.id);

  return styled(styles)(<icon>{node?.icon && <StaticImage icon={node.icon} />}</icon>);
});
