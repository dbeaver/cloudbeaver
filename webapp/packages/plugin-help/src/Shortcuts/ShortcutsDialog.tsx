/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Button, Container, Group, GroupTitle, Link, s, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { CommonDialogBody, CommonDialogFooter, CommonDialogHeader, CommonDialogWrapper, DialogComponent } from '@cloudbeaver/core-dialogs';

import { Shortcut } from './Shortcut';
import { DATA_VIEWER_SHORTCUTS, NAVIGATION_TREE_SHORTCUTS, SQL_EDITOR_SHORTCUTS } from './SHORTCUTS_DATA';
import style from './ShortcutsDialog.m.css';

export const ShortcutsDialog: DialogComponent<null> = function ShortcutsDialog({ rejectDialog }) {
  const translate = useTranslate();
  const styles = useS(style);

  return (
    <CommonDialogWrapper size="large">
      <CommonDialogHeader title={translate('shortcuts_title')} onReject={rejectDialog} />
      <CommonDialogBody>
        <Container className={s(styles, { container: true })} wrap overflow>
          <Group className={s(styles, { group: true })} overflow>
            <GroupTitle className={s(styles, { groupTitle: true })}>
              <Link href="https://dbeaver.com/docs/cloudbeaver/Data-editor/" target="_blank" wrapper indicator>
                Data Viewer
              </Link>
            </GroupTitle>
            {DATA_VIEWER_SHORTCUTS.map(shortcut => (
              <Shortcut key={shortcut.label} shortcut={shortcut} />
            ))}
          </Group>
          <Group className={s(styles, { group: true })} overflow>
            <GroupTitle className={s(styles, { groupTitle: true })}>
              <Link href="https://dbeaver.com/docs/cloudbeaver/SQL-Editor/" target="_blank" wrapper indicator>
                SQL Editor
              </Link>
            </GroupTitle>
            {SQL_EDITOR_SHORTCUTS.map(shortcut => (
              <Shortcut key={shortcut.label} shortcut={shortcut} />
            ))}
          </Group>
          <Group className={s(styles, { group: true })} overflow>
            <GroupTitle className={s(styles, { groupTitle: true })}>
              <Link href="https://dbeaver.com/docs/cloudbeaver/Database-Navigator/" target="_blank" wrapper indicator>
                Navigation Tree
              </Link>
            </GroupTitle>
            {NAVIGATION_TREE_SHORTCUTS.map(shortcut => (
              <Shortcut key={shortcut.label} shortcut={shortcut} />
            ))}
          </Group>
        </Container>
      </CommonDialogBody>
      <CommonDialogFooter>
        <Button className={s(styles, { button: true })} type="button" mod={['outlined']} onClick={rejectDialog}>
          {translate('ui_close')}
        </Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
};
