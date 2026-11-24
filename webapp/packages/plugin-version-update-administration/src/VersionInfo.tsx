/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useId } from 'react';
import ReactMarkdown from 'react-markdown';

import { Group, GroupTitle, s, useResource, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { VersionResource, VersionService } from '@cloudbeaver/core-version';

import styles from './VersionInfo.module.css';

interface Props {
  item: string;
}

export const VersionInfo = observer<Props>(function VersionInfo({ item }) {
  const translate = useTranslate();
  const style = useS(styles);
  const titleId = useId();
  const versionService = useService(VersionService);
  const versionResource = useService(VersionResource);
  useResource(VersionInfo, VersionResource, item);
  const versions = versionResource.getReleaseNotes(item);
  const hasPatches = versions.some(version => versionService.isPatch(version.number));

  return (
    <Group className={s(style, { group: true })} aria-labelledby={titleId} large>
      <GroupTitle id={titleId} className={s(style, { title: true })}>
        {versions.length > 0
          ? `${translate('plugin_version_update_administration_release_notes')} · ${item}`
          : translate('version_update_version_no_info')}
      </GroupTitle>
      {hasPatches && <p className={s(style, { description: true })}>{translate('plugin_version_update_administration_release_notes_description')}</p>}
      {versions.map(version => (
        <section key={version.number} className={s(style, { section: true })} aria-labelledby={`${titleId}-${version.number}`}>
          <header className={s(style, { heading: true })}>
            <h3 id={`${titleId}-${version.number}`}>{version.number}</h3>
            {hasPatches && (
              <span className={s(style, { badge: true })}>
                {translate(
                  versionService.isPatch(version.number)
                    ? 'plugin_version_update_administration_patch_label'
                    : 'plugin_version_update_administration_base_release',
                )}
              </span>
            )}
            {hasPatches && version.number === item && (
              <span className={s(style, { badge: true, selected: true })}>{translate('plugin_version_update_administration_selected_version')}</span>
            )}
            {version.date && <span>{version.date}</span>}
          </header>
          <div className={s(style, { notes: true })}>
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
          </div>
        </section>
      ))}
    </Group>
  );
});
