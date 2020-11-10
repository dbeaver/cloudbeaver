/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import {
  TabsState, TabList,
  Loader, SubmittingForm,
  ErrorMessage, Button,
  useFocus, BORDER_TAB_STYLES, TabPanelList
} from '@cloudbeaver/core-blocks';
import { useController, useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { AdminUserInfo } from '@cloudbeaver/core-sdk';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import { UserFormController } from './UserFormController';
import { UserFormService } from './UserFormService';

const tabStyles = composes(
  css`
    Tab {
      composes: theme-ripple theme-background-secondary theme-text-on-secondary from global;
    }
  `
);

const styles = composes(
  css`
    TabList {
      composes: theme-background-surface theme-text-on-surface from global;
    }

    ErrorMessage {
      composes: theme-background-secondary from global;
    }

    FormBox {
      composes: theme-background-secondary theme-text-on-secondary from global;
    }

    content-box {
      composes: theme-background-secondary theme-border-color-background from global;
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
      display: flex;
      flex-direction: column;
    }

    ErrorMessage {
      position: sticky;
      bottom: 0;
      padding: 8px 24px;
    }

    fill {
      flex: 1;
    }

    SubmittingForm {
      position: relative;
      min-height: 320px;
      max-height: 500px;
    }

    Button:not(:first-child) {
      margin-right: 24px;
    }

    layout-grid {
      flex: 1;
      width: 100%;
    }
  `
);

interface Props {
  user: AdminUserInfo;
  editing?: boolean;
  onCancel: () => void;
}

export const UserForm = observer(function UserForm({
  user,
  editing = false,
  onCancel,
}: Props) {
  const tabsStyles = [tabStyles, BORDER_TAB_STYLES];
  const translate = useTranslate();
  const service = useService(UserFormService);
  const controller = useController(UserFormController);
  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild: true });

  controller.update(user, editing, onCancel);

  return styled(useStyles(styles, tabsStyles))(
    <TabsState container={service.tabsContainer} user={user} controller={controller} editing={editing}>
      <box as='div'>
        <TabList style={tabsStyles}>
          <fill as="div" />
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
        </TabList>
        <content-box as='div'>
          <SubmittingForm ref={focusedRef} onSubmit={controller.save}>
            <TabPanelList style={tabsStyles} />
            {controller.isLoading && <Loader overlay />}
          </SubmittingForm>
          {controller.error.responseMessage && (
            <ErrorMessage
              text={controller.error.responseMessage}
              hasDetails={controller.error.hasDetails}
              onShowDetails={controller.showDetails}
            />
          )}
        </content-box>
      </box>
    </TabsState>
  );
});
