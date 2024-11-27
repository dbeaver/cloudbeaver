/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { USER_TEAM_ROLE_SUPERVISOR } from '@cloudbeaver/core-authentication';
import { Checkbox, StaticImage, TableColumnValue, TableItem, TableItemSelect, useTranslate } from '@cloudbeaver/core-blocks';

import classes from './GrantedUsersTableItem.module.css';

interface Props {
  id: any;
  name: string;
  icon: string;
  disabled: boolean;
  teamRole: string | null;
  teamRoles: string[];
  iconTooltip?: string;
  tooltip?: string;
  onTeamRoleAssign: (subjectId: string, teamRole: string | null) => void;
  className?: string;
}

export const GrantedUsersTableItem = observer<Props>(function GrantedUsersTableItem({
  id,
  name,
  icon,
  iconTooltip,
  tooltip,
  teamRole,
  teamRoles,
  onTeamRoleAssign,
  disabled,
  className,
}) {
  const translate = useTranslate();

  return (
    <TableItem item={id} title={tooltip} disabled={disabled} selectDisabled={disabled} className={className}>
      <TableColumnValue centerContent flex>
        <TableItemSelect disabled={disabled} />
      </TableColumnValue>
      <TableColumnValue>
        <StaticImage className={classes['staticImage']} icon={icon} title={iconTooltip} />
      </TableColumnValue>
      <TableColumnValue>{name}</TableColumnValue>
      {teamRoles.length > 0 && (
        <TableColumnValue title={translate('plugin_authentication_administration_team_user_team_role_supervisor_description')} centerContent flex>
          <Checkbox
            checked={teamRole === USER_TEAM_ROLE_SUPERVISOR}
            onChange={value => onTeamRoleAssign(id, value ? USER_TEAM_ROLE_SUPERVISOR : null)}
          />
        </TableColumnValue>
      )}
    </TableItem>
  );
});
