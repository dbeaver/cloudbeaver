/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import ReactMarkdown from 'react-markdown';

import { Container, Group, GroupItem, GroupTitle, s, useResource, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { VersionResource } from '@cloudbeaver/core-version';

import styles from './VersionInfo.module.css';

interface Props {
  item: string;
}

export const VersionInfo = observer<Props>(function VersionInfo({ item }) {
  const translate = useTranslate();
  const style = useS(styles);
  const versionResource = useResource(VersionInfo, VersionResource, item);

  const version = versionResource.tryGetData;

  return (
    <Container wrap gap overflow large>
      <Group className={s(style, { group: true })} gap overflow>
        <GroupTitle>{version ? `Release notes ${version.number} - ${version.date}` : translate('version_update_version_no_info')}</GroupTitle>
        {version && (
          <GroupItem>
            <ReactMarkdown
              components={{
                p: ({ node, ...props }) => <p className="tw:mb-4" {...props} />,
                ul: ({ node, ...props }) => <ul className="tw:list-disc tw:flex tw:flex-col tw:gap-4" {...props} />,
                ol: ({ node, ...props }) => <ol className="tw:list-decimal tw:flex tw:flex-col tw:gap-4" {...props} />,
                li: ({ node, ...props }) => <li className="tw:ml-4" {...props} />,
              }}
            >
              {version.releaseNotes}
            </ReactMarkdown>
          </GroupItem>
        )}
      </Group>
    </Container>
  );
});
