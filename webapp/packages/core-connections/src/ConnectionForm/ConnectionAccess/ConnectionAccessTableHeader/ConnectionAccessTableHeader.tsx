/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { Filter, IFilterState } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { composes, useStyles } from '@cloudbeaver/core-theming';

interface Props {
  filter: IFilterState;
  disabled: boolean;
  className?: string;
}

const styles = composes(
  css`
    header {
      composes: theme-border-color-background theme-background-surface theme-text-on-surface from global;
    }
  `,
  css`
    buttons {
      display: flex;
      gap: 16px;
      grid-gap: 16px;
    }
    header {
      overflow: hidden;
      position: sticky;
      top: 0;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      gap: 16px;
      grid-gap: 16px;
      border-bottom: 1px solid;
    }
  `
);

export const ConnectionAccessTableHeader: React.FC<Props> = observer(function ConnectionAccessTableHeader({ filter, disabled, className, children }) {
  const translate = useTranslate();
  return styled(useStyles(styles))(
    <header className={className}>
      <Filter disabled={disabled} placeholder={translate('connections_connection_access_filter_placeholder')} state={filter} />
      <buttons>
        {children}
      </buttons>
    </header>
  );
});
