/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  Button,
  IconOrImage,
  Table,
  TableBody,
  TableColumnHeader,
  TableColumnValue,
  TableHeader,
  TableItem,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import type { EngineInfo } from '@cloudbeaver/plugin-ai';
import { AIProfileCredentialsService } from '@cloudbeaver/plugin-ai-profiles';

export interface IAIProfile {
  id: string;
  name: string;
  engineId: string;
  global: boolean;
  credentialsSaved: boolean;
}

interface Props {
  profiles: IAIProfile[];
  engines: EngineInfo[];
}

export const AIProfilesTable = observer<Props>(function AIProfilesTable({ profiles, engines }) {
  const translate = useTranslate();
  const credentialsService = useService(AIProfileCredentialsService);
  const notificationService = useService(NotificationService);

  async function editCredentials(profileId: string): Promise<void> {
    try {
      await credentialsService.open(profileId);
    } catch (exception: any) {
      notificationService.logException(exception, 'plugin_ai_user_profile_credentials_edit_failed');
    }
  }

  return (
    <Table keys={profiles.map(profile => profile.id)}>
      <TableHeader fixed>
        <TableColumnHeader heightBig>{translate('plugin_ai_user_profile_column_profile')}</TableColumnHeader>
        <TableColumnHeader heightBig>{translate('plugin_ai_user_profile_column_engine')}</TableColumnHeader>
        <TableColumnHeader heightBig>{translate('plugin_ai_user_profile_column_credential_source')}</TableColumnHeader>
        <TableColumnHeader heightBig>{translate('plugin_ai_user_profile_column_status')}</TableColumnHeader>
      </TableHeader>
      <TableBody>
        {profiles.map(profile => {
          const engine = engines.find(engine => engine.id === profile.engineId);
          const engineName = engine?.name ?? profile.engineId;

          return (
            <TableItem key={profile.id} item={profile.id} selectDisabled>
              <TableColumnValue title={profile.name} ellipsis>
                <div className="tw:flex tw:items-center tw:gap-2">
                  {profile.global && <IconOrImage icon="document-global" width={16} />}
                  <span className="tw:truncate">{profile.name}</span>
                </div>
              </TableColumnValue>
              <TableColumnValue title={engineName} ellipsis>
                <div className="tw:flex tw:items-center tw:gap-2">
                  {engine?.icon && <IconOrImage icon={engine.icon} width={16} />}
                  <span className="tw:truncate">{engineName}</span>
                </div>
              </TableColumnValue>
              <TableColumnValue>
                {translate(
                  profile.global ? 'plugin_ai_user_profile_credential_source_administrator' : 'plugin_ai_user_profile_credential_source_user',
                )}
              </TableColumnValue>
              <TableColumnValue>
                {profile.global ? (
                  translate('plugin_ai_user_profile_status_managed')
                ) : (
                  <div className="tw:flex tw:items-center tw:justify-between tw:gap-4">
                    <span>
                      {translate(
                        profile.credentialsSaved ? 'plugin_ai_user_profile_status_configured' : 'plugin_ai_user_profile_status_not_configured',
                      )}
                    </span>
                    <Button variant="ghost" size="small" onClick={() => editCredentials(profile.id)}>
                      {translate(
                        profile.credentialsSaved
                          ? 'plugin_ai_user_profile_action_edit_credentials'
                          : 'plugin_ai_user_profile_action_configure_credentials',
                      )}
                    </Button>
                  </div>
                )}
              </TableColumnValue>
            </TableItem>
          );
        })}
      </TableBody>
    </Table>
  );
});
