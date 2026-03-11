import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import type { VNode } from 'preact';

export type SetHeaderActions = (node: VNode | null) => void;

export const AppHeaderActionsContext = createContext<SetHeaderActions | null>(null);

/** Use in any app to render actions in the shell header (right side). Clear on unmount. */
export function useHeaderActions(): SetHeaderActions | null {
  return useContext(AppHeaderActionsContext);
}
