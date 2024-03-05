/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Filter, s, useS, useTranslate } from '@cloudbeaver/core-blocks';

import style from './GrantedConnectionsTableHeader.m.css';

export interface IFilterState {
  filterValue: string;
}

interface Props extends React.PropsWithChildren {
  filterState: IFilterState;
  disabled: boolean;
  className?: string;
}

export const GrantedConnectionsTableHeader = observer<Props>(function GrantedConnectionsTableHeader({ filterState, disabled, className, children }) {
  const styles = useS(style);
  const translate = useTranslate();

  return (
    <header className={s(styles, { header: true }, className)}>
      <Filter
        disabled={disabled}
        placeholder={translate('administration_teams_team_granted_connections_search_placeholder')}
        name="filterValue"
        state={filterState}
      />
      <div className={s(styles, { buttons: true })}>{children}</div>
    </header>
  );
});
