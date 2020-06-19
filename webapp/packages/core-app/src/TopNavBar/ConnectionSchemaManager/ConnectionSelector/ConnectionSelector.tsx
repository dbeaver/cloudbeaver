/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css, use } from 'reshadow';

import { useController } from '@cloudbeaver/core-di';
import { useStyles } from '@cloudbeaver/core-theming';

import { TopMenuItem } from '../../shared/TopMenuItem';
import { ConnectionSelectorController } from './ConnectionSelectorController';

const menuStyles = css`
  Menu {
    max-height: 400px;
    overflow: auto;
  }
`;

const connectionMenu = css`
  menu-trigger-icon {
    background-color: #fff;
    border-radius: 4px;
    padding: 1px;
    
    & IconOrImage {
      width: 22px;
    }
  }
`;

const style = css`
  connection-selector {
    display: flex;
    height: 100%;
    visibility: hidden;
    background: #338ecc;
      
    &[use|isVisible] {
      visibility: visible;
    }
  }
`;
export const ConnectionSelector = observer(function ConnectionSelector() {
  const controller = useController(ConnectionSelectorController);
  const ConnectionMenu = TopMenuItem;
  const SchemaOrCatalogMenu = TopMenuItem;

  return styled(useStyles(style))(
    <connection-selector as="div" {...use({ isVisible: controller.isConnectionSelectorVisible })}>
      <ConnectionMenu menuItem={controller.connectionMenu} style={[menuStyles, connectionMenu]}/>
      {controller.isObjectContainerSelectorVisible && (
        <SchemaOrCatalogMenu
          menuItem={controller.objectContainerMenu}
          style={[menuStyles]}
        />
      )}
    </connection-selector>
  );
});
