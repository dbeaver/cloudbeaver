import { createContext } from 'react';
import type { IConnectionFormState } from './IConnectionFormProps';

export interface IConnectionFormActionsContext {
  save: IConnectionFormState['save'];
  test: IConnectionFormState['test'];
}

export const ConnectionFormActionsContext = createContext<IConnectionFormActionsContext | null>(null);