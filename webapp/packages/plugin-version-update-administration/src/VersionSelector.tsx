/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import styled, { css } from 'reshadow';

import { BASE_CONTAINERS_STYLES, Combobox, Container, Group, GroupItem } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { useStyles } from '@cloudbeaver/core-theming';
import { IVersion, VersionResource } from '@cloudbeaver/core-version';
import { VersionUpdateService } from '@cloudbeaver/core-version-update';

import { VersionInfo } from './VersionInfo';

interface Props {
  versions: IVersion[];
}

const style = css`
  Group {
    list-style-position: inside;
  }
  Instruction {
    white-space: pre-line;
  }
`;

export const VersionSelector = observer<Props>(function VersionSelector({ versions }) {
  const styles = useStyles(BASE_CONTAINERS_STYLES, style);
  const versionUpdateService = useService(VersionUpdateService);
  const versionResource = useService(VersionResource);
  const serverConfigResource = useService(ServerConfigResource);

  const [selected, setSelected] = useState('');

  useEffect(() => {
    if (versionResource.latest?.number) {
      setSelected(versionResource.latest.number);
    }
  }, [versionResource.latest?.number]);

  const version = versions.find(v => v.number === selected);
  const Instruction = versionUpdateService.instructionGetter?.();

  return styled(styles)(
    <Container gap>
      <Group gap large>
        <Combobox
          items={versions}
          keySelector={value => value.number}
          valueSelector={value => value.number}
          value={selected}
          tiny
          onSelect={value => setSelected(value)}
        >
          Version
        </Combobox>
        {version && Instruction && (
          <GroupItem>
            <Instruction version={version} hostName={serverConfigResource.data?.hostName} />
          </GroupItem>
        )}
      </Group>
      {version && <VersionInfo item={version.number} />}
    </Container>
  );
});
