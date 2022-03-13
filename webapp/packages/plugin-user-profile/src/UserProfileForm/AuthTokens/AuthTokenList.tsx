/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { AuthProviderConfiguration, AuthProvidersResource } from '@cloudbeaver/core-authentication';
import { IconOrImage, Link, Cell, useMapResource, Loader, Button } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { CachedMapAllKey, UserInfo } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';
import { AuthenticationService } from '@cloudbeaver/plugin-authentication';

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
    time {
      composes: theme-typography--caption from global;
    }
`;

interface Props {
  user: UserInfo;
  className?: string;
}

export const AuthTokenList = observer<Props>(function AuthTokenList({ user, className }) {
  const providersResource = useMapResource(AuthTokenList, AuthProvidersResource, CachedMapAllKey);
  const authenticationService = useService(AuthenticationService);
  const style = useStyles(styles);
  const translate = useTranslate();

  return styled(style)(
    <container className={className}>
      <Loader state={providersResource}>
        <list>
          {user.authTokens.map(token => {
            const provider = providersResource.resource.get(token.authProvider);

            if (!provider) {
              return null;
            }

            let configuration: AuthProviderConfiguration | undefined;
            let name = provider.label;
            let description = token.message || provider.description;
            let icon = provider.icon;

            if (token.authConfiguration) {
              configuration = provider.configurations?.find(
                configuration => configuration.id === token.authConfiguration
              );

              if (configuration) {
                name = configuration.displayName;
                description = configuration.description;

                if (configuration.iconURL) {
                  icon = configuration.iconURL;
                }
              }
            }

            const date = new Date(token.loginTime);
            const title = `${name}\n${description || ''}`;

            return (
              <Link
                key={provider.id + '_' + token.authConfiguration}
                title={title}
                wrapper
              >
                <Cell
                  before={icon ? <IconOrImage icon={icon} /> : undefined}
                  after={configuration && (
                    <Button
                      mod={['outlined']}
                      onClick={() => authenticationService.logoutConfiguration(configuration!.id, false)}
                    >
                      {translate('authentication_logout')}
                    </Button>
                  )}
                  // after={activeProviders.includes(provider.id) && false ? (
                  //   <provider-login-icon>
                  //     <IconOrImage
                  //       icon='/icons/success_sm.svg'
                  //       title={translate('plugin_user_profile_auth_providers_active')}
                  //     />
                  //   </provider-login-icon>
                  // ) : undefined}
                  description={(
                    <>
                      {description}<br />
                      {token.userId && (<>{token.userId}<br /></>)}
                      {date ? <time dateTime={date.toLocaleString()}>{date.toLocaleString()}</time> : undefined}
                    </>
                  )}
                >
                  {name}
                </Cell>
              </Link>
            );
          })}
        </list>
      </Loader>
    </container>
  );
});
