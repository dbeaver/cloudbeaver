/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Tag, Tags, useTranslate } from '@cloudbeaver/core-blocks';
import { Popover } from '@dbeaver/ui-kit';

import { OverflowIndicator } from './OverflowIndicator.js';

interface Props {
  teams: readonly string[];
}

const MAX_VISIBLE_TEAMS = 2;
const TEAM_TAG_CLASS_NAME =
  'tw:shrink-0 tw:max-w-44! tw:m-0 tw:px-2! tw:py-1! tw:rounded-(--theme-form-element-radius)! tw:bg-(--theme-secondary) tw:text-(--theme-on-surface)! tw:text-sm tw:leading-5';

export const UserTeamsCell = observer<Props>(function UserTeamsCell({ teams }) {
  const translate = useTranslate();
  const hiddenCount = teams.length - MAX_VISIBLE_TEAMS;
  const teamsLabel = `${translate('administration_teams_tab_title')} (${teams.length})`;

  return (
    <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-1.5">
      <Tags className="tw:w-auto! tw:min-w-0 tw:flex-nowrap! tw:gap-1.5! tw:overflow-hidden tw:m-0">
        {teams.slice(0, MAX_VISIBLE_TEAMS).map(team => (
          <Tag key={team} id={team} label={team} className={TEAM_TAG_CLASS_NAME} />
        ))}
      </Tags>
      {hiddenCount > 0 && (
        <Popover placement="top">
          <Popover.PopoverDisclosure className="tw:shrink-0" aria-label={teamsLabel}>
            <OverflowIndicator count={hiddenCount} />
          </Popover.PopoverDisclosure>
          <Popover.PopoverContent className="tw:flex tw:gap-2" aria-label={teamsLabel} gutter={4} portal modal hideOnInteractOutside unmountOnHide>
            <div className="tw:p-1">
              <Tags className="tw:max-w-80 tw:gap-1.5! tw:m-0">
                {teams.map(team => (
                  <Tag key={team} id={team} label={team} className={TEAM_TAG_CLASS_NAME} />
                ))}
              </Tags>
            </div>
          </Popover.PopoverContent>
        </Popover>
      )}
    </div>
  );
});
