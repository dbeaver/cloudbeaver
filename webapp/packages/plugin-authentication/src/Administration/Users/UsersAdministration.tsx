/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import { AdministrationItemContentProps, ADMINISTRATION_TOOLS_PANEL_STYLES } from '@cloudbeaver/core-administration';
import { Loader, ToolsAction, ToolsPanel } from '@cloudbeaver/core-blocks';
import { useController, useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import { CreateUser } from './CreateUser';
import { CreateUserService } from './CreateUserService';
import { UsersAdministrationController } from './UsersAdministrationController';
import { UsersTable } from './UsersTable/UsersTable';

const styles = composes(
  css`
    layout-grid-cell {
      composes: theme-background-surface theme-text-on-surface from global;
    }

    layout-grid-cell {
      composes: theme-border-color-background from global;
    }
  `,
  css`
    layout-grid {
      width: 100%;
      overflow: auto;
      flex: 1;
    }

    layout-grid-inner {
      min-height: 100%;
    }

    layout-grid-cell {
      position: relative;
      border: solid 1px;
    }

    Loader {
      height: 100%;
    }
  `
);

export const UsersAdministration = observer(function UsersAdministration({
  sub,
}: AdministrationItemContentProps) {
  const translate = useTranslate();
  const service = useService(CreateUserService);
  const controller = useController(UsersAdministrationController);
  const isLocalProviderAvailable = controller.isLocalProviderAvailable;

  return styled(useStyles(styles, ADMINISTRATION_TOOLS_PANEL_STYLES))(
    <>
      <ToolsPanel>
        {isLocalProviderAvailable && (
          <ToolsAction
            title={translate('authentication_administration_tools_add_tooltip')}
            icon="add"
            viewBox="0 0 24 24"
            disabled={sub && !!service.user}
            onClick={service.create}
          >
            {translate('ui_add')}
          </ToolsAction>
        )}
        <ToolsAction
          title={translate('authentication_administration_tools_refresh_tooltip')}
          icon="refresh"
          viewBox="0 0 24 24"
          onClick={controller.update}
        >
          {translate('ui_refresh')}
        </ToolsAction>
        {isLocalProviderAvailable && (
          <ToolsAction
            title={translate('authentication_administration_tools_delete_tooltip')}
            icon="trash"
            viewBox="0 0 24 24"
            disabled={!controller.itemsSelected}
            onClick={controller.delete}
          >
            {translate('ui_delete')}
          </ToolsAction>
        )}
      </ToolsPanel>
      <layout-grid>
        <layout-grid-inner>
          <layout-grid-cell {...use({ span: 12 })}>
            {controller.isProvidersLoading ? <Loader /> : (
              <>
                {sub && service.user && (
                  <CreateUser user={service.user} onCancel={service.cancelCreate} />
                )}
                <UsersTable
                  users={controller.users}
                  selectedItems={controller.selectedItems}
                  expandedItems={controller.expandedItems}
                  selectable={controller.isLocalProviderAvailable}
                />
                <Loader loading={controller.isLoading} overlay />
              </>
            )}
          </layout-grid-cell>
        </layout-grid-inner>
      </layout-grid>
    </>
  );
});
