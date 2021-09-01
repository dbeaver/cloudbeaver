/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { StaticImage, TableColumnValue, TableItem, TableItemSelect } from '@cloudbeaver/core-blocks';
import { TLocalizationToken, useTranslate } from '@cloudbeaver/core-localization';

interface Props {
  id: any;
  name: string;
  icon: string;
  disabled: boolean;
  iconTooltip?: TLocalizationToken;
  className?: string;
}

const style = css`
  StaticImage {
    display: flex;
    width: 24px;
  }
`;

export const GrantedUsersTableItem = observer<Props>(function GrantedUsersTableItem({
  id, name, icon, iconTooltip, disabled, className,
}) {
  const translate = useTranslate();
  return styled(style)(
    <TableItem
      item={id}
      disabled={disabled}
      selectDisabled={disabled}
      className={className}
    >
      <TableColumnValue centerContent flex>
        <TableItemSelect disabled={disabled} />
      </TableColumnValue>
      <TableColumnValue><StaticImage icon={icon} title={translate(iconTooltip)} /></TableColumnValue>
      <TableColumnValue>{name}</TableColumnValue>
    </TableItem>
  );
});
