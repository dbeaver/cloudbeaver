/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';

import { Combobox, Container, Group, GroupItem, GroupTitle, s, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { type IVersion, VersionResource } from '@cloudbeaver/core-version';
import { VersionUpdateService } from '@cloudbeaver/core-version-update';

import { VersionInfo } from './VersionInfo.js';
import styles from './VersionSelector.module.css';

interface Props {
  versions: IVersion[];
}

export const VersionSelector = observer<Props>(function VersionSelector({ versions }) {
  const versionUpdateService = useService(VersionUpdateService);
  const versionResource = useService(VersionResource);
  const serverConfigResource = useService(ServerConfigResource);
  const translate = useTranslate();
  const style = useS(styles);

  const [selected, setSelected] = useState('');

  useEffect(() => {
    if (versionResource.latest?.number) {
      setSelected(versionResource.latest.number);
    }
  }, [versionResource.latest?.number]);

  const version = versions.find(v => v.number === selected);
  const Instruction = versionUpdateService.versionInstructionGetter?.();
  const instructionLink = versionUpdateService.instructionLink;

  return (
    <Container gap>
      <Group className={s(style, { group: true })} gap large>
        <Combobox
          items={versions}
          keySelector={value => value.number}
          valueSelector={value => value.number}
          value={selected}
          tiny
          onSelect={value => setSelected(value)}
        >
          {translate('plugin_version_update_administration_version_selector_label')}
        </Combobox>
        {version && Instruction && (
          <GroupItem>
            <Instruction
              link={instructionLink}
              className={s(style, { instruction: true })}
              version={version}
              containerId={serverConfigResource.data?.containerId}
            />
          </GroupItem>
        )}
        <GroupTitle>{translate('plugin_version_update_administration_recommendations_label')}</GroupTitle>
        <GroupItem>
          <h4>
            <b>{translate('plugin_version_update_administration_recommendations')}</b>
          </h4>
        </GroupItem>
      </Group>
      {version && <VersionInfo item={version.number} />}
    </Container>
  );
});
