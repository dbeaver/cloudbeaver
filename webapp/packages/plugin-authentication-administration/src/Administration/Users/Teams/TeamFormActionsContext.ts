import { createContext } from 'react';
import type { ITeamFormState } from './ITeamFormProps';

export interface ITeamFormActionsContext {
  save: ITeamFormState['save'];
}

export const TeamFormActionsContext = createContext<ITeamFormActionsContext | null>(null);