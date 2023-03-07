/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { BASE_CONTAINERS_STYLES, Button, Container, Group, GroupTitle, Link, useStyles, useTranslate } from '@cloudbeaver/core-blocks';
import { CommonDialogBody, CommonDialogFooter, CommonDialogHeader, CommonDialogWrapper, DialogComponent } from '@cloudbeaver/core-dialogs';

import { Shortcut } from './Shortcut';
import { DATA_VIEWER_SHORTCUTS, NAVIGATION_TREE_SHORTCUTS, SQL_EDITOR_SHORTCUTS } from './SHORTCUTS_DATA';


const style = css`
  Button {
    margin-left: auto;
  }
  Container {
    composes: theme-typography--body2 from global;
    gap: 32px;
  }
  Group {
    gap: 16px;
  }
  GroupTitle, Group {
    padding: 0 !important;
  }
  GroupTitle {
    font-weight: bold;
  }
`;

export const ShortcutsDialog: DialogComponent<null> = function ShortcutsDialog({
  rejectDialog,
}) {
  const translate = useTranslate();
  const styles = useStyles(BASE_CONTAINERS_STYLES, style);

  return styled(styles)(
    <CommonDialogWrapper size='large'>
      <CommonDialogHeader
        title={translate('shortcuts_title')}
        onReject={rejectDialog}
      />
      <CommonDialogBody>
        <Container wrap overflow>
          <Group overflow>
            <GroupTitle>
              <Link href='https://dbeaver.com/docs/cloudbeaver/Data-editor/' target='_blank' wrapper indicator>
              Data Viewer
              </Link>
            </GroupTitle>
            {DATA_VIEWER_SHORTCUTS.map(shortcut => <Shortcut key={shortcut.label} shortcut={shortcut} />)}
          </Group>
          <Group overflow>
            <GroupTitle>
              <Link href='https://dbeaver.com/docs/cloudbeaver/SQL-Editor/' target='_blank' wrapper indicator>
              SQL Editor
              </Link>
            </GroupTitle>
            {SQL_EDITOR_SHORTCUTS.map(shortcut => <Shortcut key={shortcut.label} shortcut={shortcut} />)}
          </Group>
          <Group overflow>
            <GroupTitle>
              <Link href='https://dbeaver.com/docs/cloudbeaver/Database-Navigator/' target='_blank' wrapper indicator>
              Navigation Tree
              </Link>
            </GroupTitle>
            {NAVIGATION_TREE_SHORTCUTS.map(shortcut => <Shortcut key={shortcut.label} shortcut={shortcut} />)}
          </Group>
        </Container>
      </CommonDialogBody>
      <CommonDialogFooter>
        <Button type='button' mod={['outlined']} onClick={rejectDialog}>
          {translate('ui_close')}
        </Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
};