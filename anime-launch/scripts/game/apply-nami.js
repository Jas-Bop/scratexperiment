import { NAMI } from '../../game/characters/nami.js';
import { CHARACTERS, resolveAttackStat } from '../../game/characters/index.js';
import {
  ScratchBlocks,
  broadcastNamed,
  cloneGraph,
  ensureVariable,
  findHat,
  graphIds,
  targetNamed,
  variableNamed,
} from './scratch-blocks.js';

/** Repair the unfinished imported Nami sprite; character design values come from the catalog. */
export function applyNami(project, nami = NAMI, characters = CHARACTERS) {
  ensureVariable(project, 'task_nami_complete');
  broadcastNamed(project, 'summon_nami');
  const balance = {
    power: resolveAttackStat(nami.id, 'staff', 'power', characters),
    vertical: resolveAttackStat(nami.id, 'staff', 'vertical', characters),
  };

  configureAttack(project, balance, nami);
  configureRoster(project, nami, characters);
  configureUnlock(project, nami);
  configureSaveCodes(project, nami);
  return balance;
}

function configureAttack(project, balance, nami) {
  const sprite = targetNamed(project, 'nami');
  const template = targetNamed(project, 'asta');
  const localVelocity = variableNamed(project, sprite, 'vel x');
  const templateVelocity = variableNamed(project, template, 'vel x');
  const replacements = {
    asta: 'nami',
    summon_asta: 'summon_nami',
    [broadcastNamed(project, 'summon_asta')[1]]: broadcastNamed(project, 'summon_nami')[1],
    ammo_asta: 'ammo_Nami',
    cd_asta: 'cd_Nami',
    [variableNamed(project, template, 'ammo_asta')[1]]: variableNamed(
      project,
      sprite,
      'ammo_Nami',
    )[1],
    [variableNamed(project, template, 'cd_asta')[1]]: variableNamed(project, sprite, 'cd_Nami')[1],
    [templateVelocity[1]]: localVelocity[1],
  };

  // Replace the unfinished copied Itadori script with an existing working melee-hit sequence.
  sprite.blocks = {};
  for (const [index, id] of Object.keys(template.blocks)
    .filter((key) => template.blocks[key].topLevel)
    .entries()) {
    const root = cloneGraph(template, sprite, id, `nami:attack:${index}`, replacements, true);
    sprite.blocks[root].topLevel = true;
  }
  const builder = new ScratchBlocks(project, sprite, 'nami:attack:guard');
  const summon = findHat(sprite, 'event_whenbroadcastreceived', 'summon_nami');
  const body = sprite.blocks[summon].next;
  const guard = builder.if(
    builder.equals(builder.variable('char_nami_yn'), builder.literal(1)),
    body,
  );
  sprite.blocks[summon].next = guard;
  sprite.blocks[guard].parent = summon;

  for (const block of Object.values(sprite.blocks)) {
    if (block.opcode === 'data_setvariableto' && block.fields.VARIABLE[0] === 'ammo_Nami') {
      block.inputs.VALUE = builder.literal(nami.ammunition.perRun);
    }
    if (block.opcode === 'data_changevariableby' && block.fields.VARIABLE[0] === 'power X') {
      block.inputs.VALUE = builder.literal(balance.power);
    }
    if (block.opcode === 'data_setvariableto' && block.fields.VARIABLE[0] === 'power Y') {
      block.inputs.VALUE = builder.literal(balance.vertical);
    }
    if (block.opcode === 'data_changevariableby' && block.fields.VARIABLE[0] === 'ammo_Nami') {
      block.inputs.VALUE = builder.literal(-nami.ammunition.costPerUse);
    }
    if (block.opcode === 'operator_add')
      block.inputs.NUM2 = builder.literal(nami.attacks.staff.cooldownSeconds);
  }
}

function configureRoster(project, nami, characters) {
  const skillbar = targetNamed(project, 'skillbar');
  const builder = new ScratchBlocks(project, skillbar, 'nami:roster');
  const rosterEntry = Object.entries(skillbar.blocks).find(
    ([, block]) =>
      block.opcode === 'control_if' &&
      [...graphIds(skillbar, block.inputs.SUBSTACK?.[1])].some(
        (id) => skillbar.blocks[id].fields.COSTUME?.[0] === 'nami',
      ),
  );
  if (!rosterEntry) throw new Error('Missing final Nami roster entry');
  const entryIds = graphIds(skillbar, rosterEntry[0], false);
  skillbar.blocks[rosterEntry[1].inputs.CONDITION[1]].inputs.OPERAND2 = builder.literal(
    nami.roster.slot,
  );
  const [flagName, flagId] = variableNamed(project, skillbar, 'char_nami_yn');
  for (const id of entryIds) {
    const block = skillbar.blocks[id];
    // Repair the copied Shadow references in Nami's roster branch only.
    const repair = (value) => {
      if (value === 'char_shadow_yn') return flagName;
      if (value === variableNamed(project, skillbar, 'char_shadow_yn')[1]) return flagId;
      if (value === 'shadow') return 'nami';
      if (Array.isArray(value)) return value.map(repair);
      return value;
    };
    for (const name of Object.keys(block.inputs)) block.inputs[name] = repair(block.inputs[name]);
    if (block.opcode === 'motion_gotoxy') {
      block.inputs.X = builder.literal(nami.roster.x);
      block.inputs.Y = builder.literal(nami.roster.y);
    }
    if (block.opcode === 'control_if_else') {
      const locked = skillbar.blocks[block.inputs.SUBSTACK2?.[1]];
      if (
        locked?.opcode === 'data_setvariableto' &&
        locked.fields.VARIABLE[0] === 'skillbar_touching'
      ) {
        locked.inputs.VALUE = builder.literal('nami_locked');
      }
    }
  }

  const rosterHat = findHat(skillbar, 'event_whenbroadcastreceived', 'skillbar');
  const rosterLoop = [...graphIds(skillbar, rosterHat)]
    .map((id) => skillbar.blocks[id])
    .find((block) => block.opcode === 'control_repeat' && block.inputs.TIMES?.[1]?.[1] === '13');
  if (!rosterLoop) throw new Error('Missing character-roster creation loop');
  rosterLoop.inputs.TIMES = builder.literal(
    Math.max(...characters.map((character) => character.roster.slot)),
  );

  // Extend both skill dispatch and cooldown dimming using the same working Shadow branches.
  for (const procedure of ['summon', 'ghost']) {
    const definition = Object.entries(skillbar.blocks).find(
      ([, block]) =>
        block.opcode === 'procedures_definition' &&
        skillbar.blocks[block.inputs.custom_block[1]].mutation.proccode === procedure,
    );
    const branch = [...graphIds(skillbar, definition[0])].find((id) => {
      const block = skillbar.blocks[id];
      return (
        block.opcode === 'control_if_else' &&
        skillbar.blocks[block.inputs.CONDITION?.[1]]?.inputs.OPERAND2?.[1]?.[1] === 'shadow'
      );
    });
    if (!branch) throw new Error(`Missing Shadow ${procedure} branch`);
    const addition = cloneGraph(skillbar, skillbar, branch, `nami:${procedure}`, {
      shadow: 'nami',
      summon_shadow: 'summon_nami',
      [broadcastNamed(project, 'summon_shadow')[1]]: broadcastNamed(project, 'summon_nami')[1],
      cd_shadow: 'cd_Nami',
      ammo_shadow: 'ammo_Nami',
      [variableNamed(project, skillbar, 'cd_shadow')[1]]: variableNamed(
        project,
        skillbar,
        'cd_Nami',
      )[1],
      [variableNamed(project, skillbar, 'ammo_shadow')[1]]: variableNamed(
        project,
        skillbar,
        'ammo_Nami',
      )[1],
    });
    skillbar.blocks[branch].inputs.SUBSTACK2 = [2, addition];
    skillbar.blocks[addition].parent = branch;
  }
}

function configureUnlock(project, nami) {
  const tasks = targetNamed(project, 'tasks');
  const builder = new ScratchBlocks(project, tasks, 'nami:task');
  builder.append(
    findHat(tasks, 'event_whenflagclicked'),
    builder.set('task_nami_complete', builder.literal(0)),
  );
  const distance = builder.reporter(
    builder.block('operator_gt', {
      OPERAND1: builder.variable('Distance:'),
      OPERAND2: builder.literal(nami.unlock.distanceExclusive),
    }),
  );
  const usedLuffy = builder.reporter(
    builder.block(
      'data_listcontainsitem',
      {
        ITEM: builder.literal(nami.unlock.characterUsed),
      },
      {
        LIST: [
          'characters used',
          Object.entries(project.targets.find((target) => target.isStage).lists).find(
            ([, list]) => list[0] === 'characters used',
          )[0],
        ],
      },
    ),
  );
  const complete = builder.if(
    builder.and(distance, usedLuffy),
    builder.set('task_nami_complete', builder.literal(1)),
  );
  builder.append(findHat(tasks, 'event_whenbroadcastreceived', 'fade_to_transition_2'), complete);

  const rewards = targetNamed(project, 'anime');
  const source = Object.entries(rewards.blocks).find(([, block]) => {
    if (block.opcode !== 'control_if') return false;
    return [...graphIds(rewards, block.inputs.SUBSTACK?.[1])].some(
      (id) => rewards.blocks[id].fields?.VARIABLE?.[0] === 'char_shadow_yn',
    );
  });
  if (!source) throw new Error('Missing Shadow unlock reward');
  const reward = cloneGraph(rewards, rewards, source[0], 'nami:reward', {
    shadow: 'nami',
    task_shadow_complete: 'task_nami_complete',
    char_shadow_yn: 'char_nami_yn',
    [variableNamed(project, rewards, 'task_shadow_complete')[1]]: variableNamed(
      project,
      rewards,
      'task_nami_complete',
    )[1],
    [variableNamed(project, rewards, 'char_shadow_yn')[1]]: variableNamed(
      project,
      rewards,
      'char_nami_yn',
    )[1],
  });
  new ScratchBlocks(project, rewards, 'nami:rewards').append(
    findHat(rewards, 'event_whenbroadcastreceived', 'load_data_characters'),
    reward,
  );
}

function configureSaveCodes(project, nami) {
  const save = targetNamed(project, 'Save');
  const load = targetNamed(project, 'Load');
  const saveBuilder = new ScratchBlocks(project, save, 'nami:save');
  const saveDefinition = procedureDefinition(save, 'Create save code');
  const joined = saveBuilder.reporter(
    saveBuilder.block('operator_join', {
      STRING1: saveBuilder.variable('Save Code:'),
      STRING2: saveBuilder.literal(nami.saveToken),
    }),
  );
  saveBuilder.append(
    saveDefinition,
    saveBuilder.if(
      saveBuilder.equals(saveBuilder.variable('char_nami_yn'), saveBuilder.literal(1)),
      saveBuilder.set('Save Code:', joined),
    ),
  );
  const loadBuilder = new ScratchBlocks(project, load, 'nami:load');
  const containsToken = loadBuilder.reporter(
    loadBuilder.block('operator_contains', {
      STRING1: loadBuilder.reporter(loadBuilder.block('sensing_answer')),
      STRING2: loadBuilder.literal(nami.saveToken),
    }),
  );
  loadBuilder.append(
    procedureDefinition(load, 'Load data'),
    loadBuilder.if(containsToken, loadBuilder.set('task_nami_complete', loadBuilder.literal(1))),
  );
}

function procedureDefinition(target, name) {
  const definition = Object.entries(target.blocks).find(
    ([, block]) =>
      block.opcode === 'procedures_definition' &&
      target.blocks[block.inputs.custom_block[1]].mutation.proccode === name,
  );
  if (!definition) throw new Error(`Missing procedure: ${name}`);
  return definition[0];
}
