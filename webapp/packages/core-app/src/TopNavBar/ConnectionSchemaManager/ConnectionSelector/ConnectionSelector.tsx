/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import { useMapResource } from '@cloudbeaver/core-blocks';
import { DBDriverResource } from '@cloudbeaver/core-connections';
import { useController } from '@cloudbeaver/core-di';
import { EPermission, usePermission } from '@cloudbeaver/core-root';
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
  MenuItem IconOrImage {
    background-color: #fff;
    padding: 2px;
    border-radius: 2px;
  }
  menu-trigger-icon {
    background-color: #fff;
    border-radius: 4px;
    padding: 1px;
    
    & IconOrImage {
      width: 22px;
    }
  }
`;

const styles = css`
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
  const style = useStyles(styles);
  const controller = useController(ConnectionSelectorController);
  const isEnabled = usePermission(EPermission.public);
  const driver = useMapResource(DBDriverResource, null, { onLoad: resource => isEnabled && resource.loadAll() });
  const ConnectionMenu = TopMenuItem;
  const SchemaOrCatalogMenu = TopMenuItem;

  if (!isEnabled || !driver.isLoaded()) {
    return null;
  }

  return styled(style)(
    <connection-selector as="div" {...use({ isVisible: controller.isConnectionSelectorVisible })}>
      <ConnectionMenu menuItem={controller.connectionMenu} style={[menuStyles, connectionMenu]} />
      {controller.isObjectContainerSelectorVisible && (
        <SchemaOrCatalogMenu
          menuItem={controller.objectContainerMenu}
          style={[menuStyles]}
        />
      )}
    </connection-selector>
  );
});
