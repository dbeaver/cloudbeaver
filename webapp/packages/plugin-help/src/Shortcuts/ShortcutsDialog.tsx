/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import {
  Button,
  CommonDialogBody,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogWrapper,
  Container,
  Group,
  GroupTitle,
  Link,
  s,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import type { DialogComponent } from '@cloudbeaver/core-dialogs';
import { WEBSITE_LINKS } from '@cloudbeaver/core-links';

import { Shortcut } from './Shortcut.js';
import { DATA_VIEWER_SHORTCUTS, NAVIGATION_TREE_SHORTCUTS, SQL_EDITOR_SHORTCUTS } from './SHORTCUTS_DATA.js';
import style from './ShortcutsDialog.module.css';

export const ShortcutsDialog: DialogComponent<null> = function ShortcutsDialog({ rejectDialog }) {
  const translate = useTranslate();
  const styles = useS(style);

  return (
    <CommonDialogWrapper size="large">
      <CommonDialogHeader title={translate('shortcuts_title')} onReject={rejectDialog} />
      <CommonDialogBody>
        <Container className={s(styles, { container: true })} gap wrap overflow>
          <Group box gap dense overflow>
            <GroupTitle header>
              <Link href={WEBSITE_LINKS.DATA_EDITOR_DOCUMENTATION_PAGE} target="_blank" wrapper indicator>
                Data Viewer
              </Link>
            </GroupTitle>
            {DATA_VIEWER_SHORTCUTS.map(shortcut => (
              <Shortcut key={shortcut.label} shortcut={shortcut} />
            ))}
          </Group>
          <Group box gap dense overflow>
            <GroupTitle header>
              <Link href={WEBSITE_LINKS.SQL_EDITOR_DOCUMENTATION_PAGE} target="_blank" wrapper indicator>
                SQL Editor
              </Link>
            </GroupTitle>
            {SQL_EDITOR_SHORTCUTS.map(shortcut => (
              <Shortcut key={shortcut.label} shortcut={shortcut} />
            ))}
          </Group>
          <Group box gap dense overflow>
            <GroupTitle header>
              <Link href={WEBSITE_LINKS.DATABASE_NAVIGATOR_DOCUMENTATION_PAGE} target="_blank" wrapper indicator>
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
        <Button className={s(styles, { button: true })} type="button" variant="secondary" onClick={rejectDialog}>
          {translate('ui_close')}
        </Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
};
