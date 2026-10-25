import { ANIME_PROGRESS, isCharacterUnlock } from '../../src/shared/progress.js';
import { ensureVariable, findHat, ScratchBlocks, targetNamed } from './scratch-blocks.js';

/** Admin is a local game profile, not an authorization role for the website. */
export const ADMIN_LOAD_CODE = '14876178431werW';

export function applyAccounts(project) {
  for (const name of [
    ANIME_PROGRESS.adminFlag,
    ANIME_PROGRESS.activeAccount,
    ...ANIME_PROGRESS.startupMarkers,
  ]) {
    ensureVariable(project, name, 0);
  }
  for (const [sprite, marker] of [
    ['tasks', ANIME_PROGRESS.startupMarkers[0]],
    ['anime', ANIME_PROGRESS.startupMarkers[1]],
  ]) {
    const target = targetNamed(project, sprite);
    const builder = new ScratchBlocks(project, target, `accounts:${sprite}`);
    builder.append(
      findHat(target, 'event_whenflagclicked'),
      builder.set(marker, builder.literal(1)),
    );
  }

  const load = targetNamed(project, 'Load');
  const builder = new ScratchBlocks(project, load, 'accounts:load');
  const hat = findHat(load, 'event_whenbroadcastreceived', 'load_data');
  const ask = load.blocks[hat].next;
  const guardId = load.blocks[ask].next;
  const guard = load.blocks[guardId];
  if (load.blocks[ask].opcode !== 'sensing_askandwait' || guard.opcode !== 'control_if_else') {
    throw new Error('The original Load flow has changed.');
  }
  const isAdminCode = () =>
    builder.equals(
      builder.reporter(builder.block('sensing_answer')),
      builder.literal(ADMIN_LOAD_CODE),
    );
  const original = guard.inputs.CONDITION;
  guard.inputs.CONDITION = builder.reporter(
    builder.block('operator_or', { OPERAND1: original, OPERAND2: isAdminCode() }),
  );
  load.blocks[guard.inputs.CONDITION[1]].parent = guardId;

  const stage = project.targets.find((target) => target.isStage);
  const unlocks = Object.values(stage.variables)
    .map(([name]) => name)
    .filter(isCharacterUnlock)
    .map((name) => builder.set(name, builder.literal(1)));
  unlocks.push(
    builder.set(
      ANIME_PROGRESS.ammunitionLevel,
      builder.literal(ANIME_PROGRESS.maximumAmmunitionLevel),
    ),
    builder.set(ANIME_PROGRESS.adminFlag, builder.literal(1)),
  );
  const branch = builder.if(isAdminCode(), builder.chain(...unlocks));
  const originalLoad = guard.inputs.SUBSTACK[1];
  guard.inputs.SUBSTACK = builder.reporter(branch);
  load.blocks[branch].parent = guardId;
  load.blocks[branch].next = originalLoad;
  load.blocks[originalLoad].parent = branch;
}
