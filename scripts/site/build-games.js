import path from 'node:path';
import { spawnSync } from 'node:child_process';

/** Each game owns its build. The hub only asks for its finished dist folder. */
export function buildGames(root, games) {
  for (const game of games) {
    const result = spawnSync('npm', ['run', 'build'], {
      cwd: path.join(root, game.projectDirectory),
      stdio: 'inherit',
    });
    if (result.error) throw result.error;
    if (result.status !== 0)
      throw new Error(
        `${game.title} failed to build. Run npm run setup if dependencies are missing.`,
      );
  }
}
