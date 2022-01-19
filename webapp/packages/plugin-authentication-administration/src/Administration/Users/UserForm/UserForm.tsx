/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { TabsState, TabList, TabPanelList, UNDERLINE_TAB_STYLES } from '@cloudbeaver/core-ui';
import { Loader, SubmittingForm, Button, useFocus, StatusMessage } from '@cloudbeaver/core-blocks';
import { useController, useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { AdminUserInfo } from '@cloudbeaver/core-sdk';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import { UserFormController } from './UserFormController';
import { UserFormService } from './UserFormService';

const tabsStyles = css`
  TabList {
    position: relative;
    flex-shrink: 0;
    align-items: center;
  }
  Tab {
    height: 46px!important;
    text-transform: uppercase;
    font-weight: 500 !important;
  }
`;

const formStyles = composes(
  css`
    FormBox {
      composes: theme-background-secondary theme-text-on-secondary from global;
    }
    content-box {
      composes: theme-background-secondary theme-text-on-secondary theme-border-color-background from global;
    }
`,
  css`
    box {
      display: flex;
      flex-direction: column;
      flex: 1;
      height: 100%;
      overflow: auto;
    }
    content-box {
      display: flex;
      flex: 1;
      flex-direction: column;
      overflow: auto;
    }
    SubmittingForm {
      flex: 1;
      overflow: auto;
      display: flex;
      flex-direction: column;
    }
`);

const topBarStyles = composes(
  css`
    connection-top-bar {
      composes: theme-border-color-background theme-background-secondary theme-text-on-secondary from global;
    }
  `,
  css`
    connection-top-bar {
      position: relative;
      display: flex;
      padding-top: 16px;

      &:before {
        content: '';
        position: absolute;
        bottom: 0;
        width: 100%;
        border-bottom: solid 2px;
        border-color: inherit;
      }
    }
    connection-top-bar-tabs {
      overflow: hidden;
      flex: 1;
    }
    StatusMessage {
      padding: 0 16px;
    }
    connection-top-bar-actions {
      display: flex;
      align-items: center;
      padding: 0 24px;
      gap: 16px;
    }
  `
);

interface Props {
  user: AdminUserInfo;
  editing?: boolean;
  onCancel: () => void;
}

export const UserForm = observer<Props>(function UserForm({
  user,
  editing = false,
  onCancel,
}) {
  const style = [tabsStyles, UNDERLINE_TAB_STYLES];
  const styles = useStyles(style, topBarStyles, formStyles);
  const translate = useTranslate();
  const service = useService(UserFormService);
  const controller = useController(UserFormController);
  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild: true });

  controller.update(user, editing, onCancel);

  return styled(useStyles(styles))(
    <TabsState container={service.tabsContainer} user={user} controller={controller} editing={editing}>
      <box>
        <connection-top-bar>
          <connection-top-bar-tabs>
            <StatusMessage
              status={controller.statusMessage?.status}
              message={controller.statusMessage?.message}
              onShowDetails={controller.error.hasDetails ? controller.showDetails : undefined}
            />
            <TabList style={style} />
          </connection-top-bar-tabs>
          <connection-top-bar-actions>
            <Button
              type="button"
              disabled={controller.isSaving}
              mod={['outlined']}
              onClick={onCancel}
            >
              {translate('ui_processing_cancel')}
            </Button>
            <Button
              type="button"
              disabled={controller.isSaving}
              mod={['unelevated']}
              onClick={controller.save}
            >
              {translate(!editing ? 'ui_processing_create' : 'ui_processing_save')}
            </Button>
          </connection-top-bar-actions>
        </connection-top-bar>
        <content-box>
          <SubmittingForm ref={focusedRef}>
            <TabPanelList style={style} />
            <Loader loading={controller.isLoading} overlay />
          </SubmittingForm>
        </content-box>
      </box>
    </TabsState>
  );
});
