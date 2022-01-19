/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Icon } from '../Icon';

interface IProps {
  onClick?: () => void;
}

export const GroupClose: React.FC<IProps & React.HTMLAttributes<HTMLDivElement>> = function GroupClose({
  onClick,
  ...rest
}) {
  return <div {...rest}><Icon name="cross" viewBox="0 0 16 16" onClick={onClick} /></div>;
};
