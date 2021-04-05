/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { AuthProviderService, UserInfoResource } from '@cloudbeaver/core-authentication';
import { BASE_CONTAINERS_STYLES, Button, Container, GroupItem } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { ObjectOrigin } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

const styles = css`
  Container {
    justify-content: center;
    align-items: center;
  }
`;

export type Props = {
  children?: () => React.ReactNode;
  className?: string;
} & ({
  origin: ObjectOrigin;
} | {
  type: string;
  subType?: string;
});

export const AuthenticationProvider: React.FC<Props> = observer(function AuthenticationProvider(props) {
  const translate = useTranslate();
  const style = useStyles(styles, BASE_CONTAINERS_STYLES);
  const authProviderService = useService(AuthProviderService);
  const userInfoService = useService(UserInfoResource);
  let type: string;
  let subType: string | undefined;

  if ('origin' in props) {
    type = props.origin.type;
    subType = props.origin.subType;
  } else {
    type = props.type;
    subType = props.subType;
  }

  const authorized = userInfoService.hasToken(type, subType);

  if (authorized) {
    return props.children?.() as null || null;
  }

  function handleAuth() {
    authProviderService.requireProvider(type, subType);
  }

  return styled(style)(
    <Container className={props.className} gap vertical>
      <GroupItem keepSize>
        {translate('authentication_request_token')}
      </GroupItem>
      <GroupItem keepSize>
        <Button
          type='button'
          mod={['unelevated']}
          onClick={handleAuth}
        >
          {translate('Authenticate')}
        </Button>
      </GroupItem>
    </Container>
  );
});
