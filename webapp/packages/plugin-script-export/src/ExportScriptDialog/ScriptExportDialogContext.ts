/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext, useContext } from 'react';

interface IScriptExportDialogContext {
  resolveDialog: (result: void | undefined) => void;
  rejectDialog: () => void;
  FooterSlot: React.FC<React.PropsWithChildren>;
}

const ScriptExportDialogContext = createContext<IScriptExportDialogContext | null>(null);

export function useScriptExportDialog(): IScriptExportDialogContext {
  const context = useContext(ScriptExportDialogContext);

  if (!context) {
    throw new Error('Script export dialog context was not provided');
  }

  return context;
}

export { ScriptExportDialogContext };
