/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { Select, Container, Group, GroupItem, GroupTitle, s, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { type IVersion, VersionResource, VersionService } from '@cloudbeaver/core-version';
import { VersionUpdateService } from '@cloudbeaver/core-version-update';
import { ProductInfoService } from '@cloudbeaver/plugin-product-information-administration';

import { VersionInfo } from './VersionInfo.js';
import styles from './VersionSelector.module.css';

interface Props {
  versions: IVersion[];
}

export const VersionSelector = observer<Props>(function VersionSelector({ versions }) {
  const versionUpdateService = useService(VersionUpdateService);
  const administrationScreenService = useService(AdministrationScreenService);
  const versionService = useService(VersionService);
  const versionResource = useService(VersionResource);
  const serverConfigResource = useService(ServerConfigResource);
  const translate = useTranslate();
  const style = useS(styles);

  const version =
    versions.find(v => v.number === administrationScreenService.activeScreen?.param) ??
    versions.find(v => v.number === versionResource.latest?.number) ??
    versions[0];

  const Instruction = versionUpdateService.versionInstructionGetter?.();
  const instructionLink = versionUpdateService.instructionLink;

  return (
    <Container gap large>
      <Group className={s(style, { group: true })} gap large>
        <Select
          items={versions}
          keySelector={value => value.number}
          valueSelector={value =>
            versionService.isHotfix(value.number)
              ? `${value.number} · ${translate('plugin_version_update_administration_hotfix_label')}`
              : value.number
          }
          value={version?.number ?? ''}
          tiny
          onSelect={value => administrationScreenService.navigateToItemSub(ProductInfoService.PAGE_NAME, 'version-update', value)}
        >
          {translate('plugin_version_update_administration_version_selector_label')}
        </Select>
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
