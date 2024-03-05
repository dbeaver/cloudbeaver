/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

export const DNDProvider: React.FC<React.PropsWithChildren> = function DNDProvider({ children }) {
  return <DndProvider backend={HTML5Backend}>{children}</DndProvider>;
};
