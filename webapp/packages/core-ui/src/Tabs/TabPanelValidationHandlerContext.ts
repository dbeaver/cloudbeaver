import { MutableRefObject, createContext } from 'react';

export interface ITabPanelValidationHandlerContext {
  invalidTabs: MutableRefObject<Set<string>>;
  validate: (tabId: string) => void;
}

export const TabPanelValidationHandlerContext = createContext<ITabPanelValidationHandlerContext | null>(null);