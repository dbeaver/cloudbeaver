/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { AuthProvidersResource } from '@cloudbeaver/core-authentication';
import { IconOrImage, Link, Cell, useResource, Loader, getComputed, useTranslate, useStyles } from '@cloudbeaver/core-blocks';
import { resourceKeyList, UserInfo } from '@cloudbeaver/core-sdk';


const styles = css`
    container {
      display: flex;
      flex-direction: column;
      overflow: auto;
    }
    list {
      overflow: auto;
    }
    Cell {
      composes: theme-border-color-secondary from global;
      border-bottom: 1px solid;
      padding: 0 16px;
    }
    IconOrImage {
      width: 100%;
      height: 100%;
    }
    provider-login-icon {
      width: 24px;
      height: 24px;
    }
`;

interface Props {
  user: UserInfo;
  providers: string[];
  className?: string;
}

export const AuthProvidersList = observer<Props>(function AuthProvidersList({ user, providers, className }) {
  const providersResource = useResource(AuthProvidersList, AuthProvidersResource, resourceKeyList(providers));
  const translate = useTranslate();
  const style = useStyles(styles);
  const activeProviders = getComputed(() => user.authTokens.map(token => token.authProvider));

  return styled(style)(
    <container className={className}>
      <Loader state={providersResource}>
        {() => styled(style)(
          <list>
            {providersResource.data.map(provider => {
              if (!provider) {
                return null;
              }

              const title = `${provider.label}\n${provider.description || ''}`;
              return (
                <Link
                  key={provider.id}
                  title={title}
                  wrapper
                >
                  <Cell
                    before={provider.icon ? <IconOrImage icon={provider.icon} /> : undefined}
                    after={activeProviders.includes(provider.id) ? (
                      <provider-login-icon>
                        <IconOrImage icon='/icons/success_sm.svg' title={translate('plugin_user_profile_auth_providers_active')} />
                      </provider-login-icon>
                    ) : undefined}
                    description={provider.description}
                  >
                    {provider.label}
                  </Cell>
                </Link>
              );
            })}
          </list>
        )}
      </Loader>
    </container>
  );
});
