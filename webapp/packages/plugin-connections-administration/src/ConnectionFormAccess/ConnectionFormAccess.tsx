/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useMemo, useState } from 'react';

import { TeamsResource, UsersResource, UsersResourceFilterKey } from '@cloudbeaver/core-authentication';
import {
  ColoredContainer,
  Container,
  Group,
  InfoItem,
  Loader,
  s,
  TextPlaceholder,
  useAutoLoad,
  useObservableRef,
  useResource,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { ConnectionInfoOriginResource, ConnectionInfoResource, createConnectionParam, isCloudConnection } from '@cloudbeaver/core-connections';
import type { TLocalizationToken } from '@cloudbeaver/core-localization';
import { CachedMapAllKey, CachedResourceOffsetPageListKey } from '@cloudbeaver/core-resource';
import { FormMode, type TabContainerPanelComponent, useTab } from '@cloudbeaver/core-ui';
import { getConnectionFormOptionsPart, type IConnectionFormProps } from '@cloudbeaver/plugin-connections';

import styles from './ConnectionFormAccess.module.css';
import { getConnectionFormAccessPart } from './getConnectionFormAccessPart.js';
import { ConnectionFormAccessTableGrantedList } from './ConnectionFormAccessTable/ConnectionFormAccessTableGrantedList.js';
import { ConnectionFormAccessTableList } from './ConnectionFormAccessTable/ConnectionFormAccessTableList.js';

export const ConnectionFormAccess: TabContainerPanelComponent<IConnectionFormProps> = observer(function ConnectionFormAccess({ tabId, formState }) {
  const translate = useTranslate();
  const style = useS(styles);
  const state = useObservableRef(
    () => ({
      editing: false,
      toggleEdit() {
        this.editing = !this.editing;
      },
    }),
    {
      editing: observable.ref,
      toggleEdit: action.bound,
    },
    false,
  );

  const { selected } = useTab(tabId);
  const accessPart = getConnectionFormAccessPart(formState);
  const [initialFormMode] = useState<FormMode>(formState.mode);

  useAutoLoad(ConnectionFormAccess, accessPart, selected);

  const users = useResource(ConnectionFormAccess, UsersResource, CachedResourceOffsetPageListKey(0, 1000).setParent(UsersResourceFilterKey()), {
    active: selected,
  });
  const teams = useResource(ConnectionFormAccess, TeamsResource, CachedMapAllKey, { active: selected });

  const grantedUsers = useMemo(
    () => computed(() => users.resource.values.filter(user => accessPart.state.includes(user.userId))),
    [accessPart.state, users.resource],
  );

  const grantedTeams = useMemo(
    () => computed(() => teams.resource.values.filter(team => accessPart.state.includes(team.teamId))),
    [accessPart.state, teams.resource],
  );

  const optionsPart = getConnectionFormOptionsPart(formState);
  const connectionInfoResource = useResource(
    ConnectionFormAccess,
    ConnectionInfoResource,
    createConnectionParam(formState.state.projectId, optionsPart.state.connectionId!),
    {
      active: selected && !!formState.state.projectId && !!optionsPart.state.connectionId,
    },
  );
  const originInfoResource = useResource(
    ConnectionFormAccess,
    ConnectionInfoOriginResource,
    createConnectionParam(formState.state.projectId, optionsPart.state.connectionId!),
    {
      active: selected && !!formState.state.projectId && !!optionsPart.state.connectionId,
    },
  );
  const connectionInfo = connectionInfoResource.data;
  const originInfo = originInfoResource.data;
  const loading = users.isLoading() || teams.isLoading() || accessPart.isLoading();
  const cloud = connectionInfo && originInfo?.origin ? isCloudConnection(originInfo.origin) : false;
  const disabled = loading || !accessPart.isLoaded() || formState.isDisabled || cloud;
  let info: TLocalizationToken | null = null;

  if (initialFormMode === FormMode.Edit && accessPart.isChanged) {
    info = 'ui_save_reminder';
  } else if (cloud) {
    info = 'cloud_connections_access_placeholder';
  }

  if (!selected) {
    return null;
  }

  return (
    <Loader className={s(style, { loader: true })} state={[users, teams, accessPart]}>
      {() => (
        <ColoredContainer className={s(style, { coloredContainer: true })} parent gap vertical>
          {!users.resource.values.length && !teams.resource.values.length ? (
            <Group className={s(style, { group: true })} keepSize large>
              <TextPlaceholder>{translate('core_connections_connection_access_empty')}</TextPlaceholder>
            </Group>
          ) : (
            <>
              {info && <InfoItem info={info} />}
              <Container gap overflow>
                <ConnectionFormAccessTableGrantedList
                  grantedUsers={grantedUsers.get()}
                  grantedTeams={grantedTeams.get()}
                  disabled={disabled}
                  onEdit={state.toggleEdit}
                  onRevoke={accessPart.revoke}
                />
                {state.editing && (
                  <ConnectionFormAccessTableList
                    userList={users.resource.values}
                    teamList={teams.resource.values}
                    grantedSubjects={accessPart.state}
                    disabled={disabled}
                    onGrant={accessPart.grant}
                  />
                )}
              </Container>
            </>
          )}
        </ColoredContainer>
      )}
    </Loader>
  );
});
