/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { StaticImage } from '@cloudbeaver/core-blocks';

import { AdminConnection } from '../../ConnectionsResource';

interface IDetailInfo {
  icon: string;
  title: string;
}
interface Props {
  context: AdminConnection;
}

const styles = css`
  details-container {
    display: flex;
    & StaticImage:last-child {
      margin-right: 0;
    }
  }
  StaticImage {
    width: 24px;
    height: 24px;
    margin-right: 10px;
  }
`;
export const ConnectionDetailsInfo = function ConnectionDetailsInfo({ context }: Props) {
  const detailsToDisplay: IDetailInfo[] = [];

  if (context.origin.type !== 'local') {
    detailsToDisplay.push({ icon: context.origin.icon || '', title: context.origin.displayName });
  } else {
    detailsToDisplay.push({ icon: '/icons/local_connection.svg' || '', title: 'Local connection' });
  }

  if (context.template) {
    detailsToDisplay.push({ icon: '/icons/template_connection.svg', title: 'Template connection' });
  }

  return styled(styles)(
    <details-container as='div'>
      {detailsToDisplay.map(({ icon, title }, idx) => (
        <StaticImage key={idx} icon={icon} title={title} />
      ))}
    </details-container>
  );
};
