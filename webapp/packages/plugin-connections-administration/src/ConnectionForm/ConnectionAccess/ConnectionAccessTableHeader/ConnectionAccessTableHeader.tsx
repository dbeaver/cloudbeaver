/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Filter, s, useS, useTranslate } from '@cloudbeaver/core-blocks';

import styles from './ConnectionAccessTableHeader.m.css';

export interface IFilterState {
  filterValue: string;
}

interface Props {
  filterState: IFilterState;
  disabled: boolean;
  className?: string;
}

export const ConnectionAccessTableHeader = observer<React.PropsWithChildren<Props>>(function ConnectionAccessTableHeader({
  filterState,
  disabled,
  className,
  children,
}) {
  const translate = useTranslate();
  const style = useS(styles);
  return (
    <div className={s(style, { header: true }, className)}>
      <Filter
        disabled={disabled}
        placeholder={translate('connections_connection_access_filter_placeholder')}
        name="filterValue"
        state={filterState}
      />
      <div className={s(style, { buttons: true })}>{children}</div>
    </div>
  );
});
