import { ensureVariable, findHat, ScratchBlocks, targetNamed } from './scratch-blocks.js';

/** Admin is a local game profile, not an authorization role for the website. */
export const ADMIN_LOAD_CODE = '14876178431werW';

export function applyAccounts(project) {
  for (const name of [
    'web_admin_yn',
    'web_account_active',
    'web_accounts_tasks_ready',
    'web_accounts_characters_ready',
  ]) {
    ensureVariable(project, name, 0);
  }
  for (const [sprite, marker] of [
    ['tasks', 'web_accounts_tasks_ready'],
    ['anime', 'web_accounts_characters_ready'],
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
    builder.and(
      builder.equals(
        builder.reporter(builder.block('sensing_answer')),
        builder.literal(ADMIN_LOAD_CODE),
      ),
      builder.equals(builder.variable('web_account_active'), builder.literal(1)),
    );
  const original = guard.inputs.CONDITION;
  guard.inputs.CONDITION = builder.reporter(
    builder.block('operator_or', { OPERAND1: original, OPERAND2: isAdminCode() }),
  );
  load.blocks[guard.inputs.CONDITION[1]].parent = guardId;

  const stage = project.targets.find((target) => target.isStage);
  const unlocks = Object.values(stage.variables)
    .map(([name]) => name)
    .filter((name) => /^char_[a-z0-9]+_yn$/.test(name) || /^task_[a-z0-9]+_complete$/.test(name))
    .map((name) => builder.set(name, builder.literal(1)));
  unlocks.push(
    builder.set('task_ammo_increase', builder.literal(7)),
    builder.set('web_admin_yn', builder.literal(1)),
  );
  const branch = builder.if(isAdminCode(), builder.chain(...unlocks));
  const originalLoad = guard.inputs.SUBSTACK[1];
  guard.inputs.SUBSTACK = builder.reporter(branch);
  load.blocks[branch].parent = guardId;
  load.blocks[branch].next = originalLoad;
  load.blocks[originalLoad].parent = branch;
}
