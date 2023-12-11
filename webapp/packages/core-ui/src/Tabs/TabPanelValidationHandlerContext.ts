import { MutableRefObject, createContext } from 'react';

export interface ITabPanelValidationHandlerContext {
  invalidTabs: MutableRefObject<Set<string>>;
  addInvalidTab: (tabId: string) => void;
}

export const TabPanelValidationHandlerContext = createContext<ITabPanelValidationHandlerContext | null>(null);