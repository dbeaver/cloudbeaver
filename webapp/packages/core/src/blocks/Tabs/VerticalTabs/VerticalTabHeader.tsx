/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import {
  HTMLAttributes,
} from 'react';
import styled, { css, use } from 'reshadow';

import { composes, useStyles } from '@dbeaver/core/theming';

import { IconOrImage } from '../../IconOrImage';
import { ITab } from '../ITab';
import { Tab } from '../Tab/Tab';


const styles = composes(
  css`
    Tab {
      composes: theme-ripple theme-ripple-selectable from global;
    }
  `,
  css`
    tab-icon {
      padding-right: 16px;
      
      & IconOrImage {
        display: block;
        width: 22px;
        height: 22px;
      }
    }

    Tab[|vertical] {
      border: none !important;
      display: flex;
      flex-shrink: 0;
      text-align: left;
      align-items: center;
      outline: none;
      font-weight: 500;
  
      height: 36px;
      padding: 0 16px;
      background: transparent;
      color: inherit;
  
      &:global([aria-selected]):before {
        display: block;
      }
      &:not(:global([aria-selected])) {
        cursor: pointer;
        font-weight: normal;
      }
    }
  `
);

type VerticalTabHeaderProps = HTMLAttributes<HTMLDivElement> & {
  tab: ITab;
}

export const VerticalTabHeader = observer(function VerticalTabHeader({ tab, ...props }: VerticalTabHeaderProps) {

  return styled(useStyles(styles))(
    <Tab
      {...use({ vertical: true })}
      tabId={tab.tabId}
      onOpen={tab.onActivate}
      onClose={tab.onClose}
      {...props}
    >
      {tab.icon && (
        <tab-icon as="div">
          <IconOrImage icon={tab.icon} />
        </tab-icon>
      )}
      <div>{tab.title}</div>
    </Tab>
  );
});
