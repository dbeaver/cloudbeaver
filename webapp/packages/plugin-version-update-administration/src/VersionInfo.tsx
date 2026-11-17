/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import ReactMarkdown from 'react-markdown';

import { Container, Group, GroupItem, GroupTitle, s, useResource, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { VersionResource } from '@cloudbeaver/core-version';

import styles from './VersionInfo.module.css';

interface Props {
  item: string;
}

export const VersionInfo = observer<Props>(function VersionInfo({ item }) {
  const translate = useTranslate();
  const style = useS(styles);
  const versionResource = useService(VersionResource);
  useResource(VersionInfo, VersionResource, item);
  const versions = versionResource.getReleaseNotes(item);

  return (
    <Container wrap gap overflow large>
      {versions.length === 0 && <GroupTitle>{translate('version_update_version_no_info')}</GroupTitle>}
      {versions.map(version => (
        <Group key={version.number} className={s(style, { group: true })} gap overflow>
          <GroupTitle>{`Release notes ${version.number}${version.date ? ` - ${version.date}` : ''}`}</GroupTitle>
          <GroupItem>
            <ReactMarkdown
              components={{
                p: ({ node, ...props }) => <p className="tw:mb-4" {...props} />,
                ul: ({ node, ...props }) => <ul className="tw:[&_ul_li]:ml-7 tw:list-disc tw:[&_ul]:list-[circle]" {...props} />,
                ol: ({ node, ...props }) => <ol className="tw:[&_ol_li]:ml-7 tw:list-decimal" {...props} />,
                li: ({ node, ...props }) => <li className="tw:ml-4 tw:[&+&]:mt-1" {...props} />,
              }}
            >
              {version.releaseNotes}
            </ReactMarkdown>
          </GroupItem>
        </Group>
      ))}
    </Container>
  );
});
