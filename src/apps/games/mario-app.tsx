import type { AppContext, AppInstance } from '../../types/plugin';
import { PLUGIN_API_VERSION } from '../../types/plugin';
import { MarioGame } from './mario';

function MarioApp(_context: AppContext): AppInstance {
  return {
    render: () => (
      <div class="game-view">
        <MarioGame />
      </div>
    ),
    getTitle: () => 'Mario',
  };
}

export const marioApp = {
  id: 'mario',
  name: 'Mario',
  icon: '🍄',
  iconFallback: 'M',
  category: 'game' as const,
  apiVersion: PLUGIN_API_VERSION,
  metadata: {},
  launch: MarioApp,
};
