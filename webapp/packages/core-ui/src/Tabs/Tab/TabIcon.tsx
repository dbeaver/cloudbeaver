/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { IconOrImage, s, useS } from '@cloudbeaver/core-blocks';

import { baseTabStyles } from '../..';

interface IProps {
  icon?: string;
  viewBox?: string;
  className?: string;
}

export const TabIcon: React.FC<IProps> = function TabIcon({ icon, viewBox, className }) {
  const styles = useS(baseTabStyles);

  return (
    <div className={s(styles, { tabIcon: true }, className)}>
      {icon ? (
        <IconOrImage className={s(styles, { iconOrImage: true })} icon={icon} viewBox={viewBox} />
      ) : (
        <div className={s(styles, { placeholder: true })} />
      )}
    </div>
  );
};
