/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { Filter } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

export interface IFilterState {
  filterValue: string;
}

interface Props {
  filterState: IFilterState;
  disabled: boolean;
  className?: string;
}

const styles = css`
    buttons {
      display: flex;
      gap: 16px;
    }
    header {
      composes: theme-border-color-background theme-background-surface theme-text-on-surface from global;
      overflow: hidden;
      position: sticky;
      top: 0;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      gap: 16px;
      border-bottom: 1px solid;
    }
  `;

export const GrantedConnectionsTableHeader = observer<Props>(function GrantedConnectionsTableHeader({ filterState, disabled, className, children }) {
  const translate = useTranslate();
  return styled(useStyles(styles))(
    <header className={className}>
      <Filter
        disabled={disabled}
        placeholder={translate('administration_roles_role_granted_connections_search_placeholder')}
        name='filterValue'
        state={filterState}
      />
      <buttons>
        {children}
      </buttons>
    </header>
  );
});
