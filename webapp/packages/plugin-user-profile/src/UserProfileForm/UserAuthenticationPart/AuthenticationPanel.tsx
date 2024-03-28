/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { ColoredContainer, Container, useAutoLoad } from '@cloudbeaver/core-blocks';
import { TabContainerPanelComponent, useTab, useTabState } from '@cloudbeaver/core-ui';

import type { UserProfileFormProps } from '../UserProfileFormService';
import { ChangePassword } from './ChangePassword';
import type { UserProfileFormAuthenticationPart } from './UserProfileFormAuthenticationPart';

export const AuthenticationPanel: TabContainerPanelComponent<UserProfileFormProps> = observer(function AuthenticationPanel({ tabId }) {
  const tab = useTab(tabId);
  const tabState = useTabState<UserProfileFormAuthenticationPart>();

  useAutoLoad(AuthenticationPanel, tabState, tab.selected);

  const disabled = tabState.isLoading();
  return (
    <ColoredContainer wrap overflow gap>
      <Container medium gap>
        <ChangePassword state={tabState.state} disabled={disabled} />
      </Container>
    </ColoredContainer>
  );
});
