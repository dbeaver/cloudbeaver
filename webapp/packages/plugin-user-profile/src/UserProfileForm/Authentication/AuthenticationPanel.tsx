/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { ColoredContainer, Container } from '@cloudbeaver/core-blocks';
import { TabPanel } from '@cloudbeaver/core-ui';

import { ChangePassword } from './ChangePassword/ChangePassword';

interface Props {
  className?: string;
}

export const AuthenticationPanel = observer<Props>(function AuthenticationPanel({ className }) {
  return (
    <TabPanel tabId="authentication" className={className}>
      <ColoredContainer wrap overflow parent gap>
        <Container medium gap>
          <ChangePassword />
        </Container>
      </ColoredContainer>
    </TabPanel>
  );
});
