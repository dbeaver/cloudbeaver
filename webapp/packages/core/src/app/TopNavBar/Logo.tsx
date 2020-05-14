/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { Icon } from '@dbeaver/core/blocks';
import { useService } from '@dbeaver/core/di';
import { ServerService } from '@dbeaver/core/root';

declare const version: string; // declared in webpack DefinePlugin // todo move to enviroment?

const styles = css`
  logo {
    height: 100%;
    display: flex;
    align-items: center;
    margin-right: 16px;
    width: 250px;
  }

  Icon {
    height: 24px;
    width: auto;
    margin-bottom: 2px;
  }
`;

export const Logo = observer(function Logo() {
  const serverService = useService(ServerService);
  const title = `Frontend: ${version}\nBackend: ${serverService.config.data?.version}`;

  return styled(styles)(
    <logo as="div" title={title}>
      <Icon name="logo" viewBox="0 0 361 73" />
    </logo>
  );
});
