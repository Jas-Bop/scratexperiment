import { createHash } from 'node:crypto';
import JSZip from '@turbowarp/jszip';
import { NAMI } from '../../game/characters/nami.js';
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

/** Keep character changes readable in source instead of manually editing opaque SB3 block IDs. */
export async function prepareGame(projectBytes) {
  const archive = await JSZip.loadAsync(projectBytes);
  const project = JSON.parse(await archive.file('project.json').async('string'));
  const balance = applyNami(project);
  addInfoCostume(archive, project, 'nami', [
    'NAMI',
    NAMI.description,
    `Power: ${balance.power}`,
    `Vertical: ${balance.vertical}`,
  ]);
  addInfoCostume(archive, project, 'nami_locked', ['NAMI · LOCKED', 'Task:', NAMI.unlock.task]);
  await addRewardDescription(archive, project);
  archive.file('project.json', JSON.stringify(project));
  return archive.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

export function applyNami(project) {
  ensureVariable(project, 'task_nami_complete');
  broadcastNamed(project, 'summon_nami');
  const reference = targetNamed(project, NAMI.referenceCharacter);
  const attackValue = (variable) => {
    const attack = Object.values(reference.blocks).find(
      (block) =>
        ['data_changevariableby', 'data_setvariableto'].includes(block.opcode) &&
        block.fields.VARIABLE[0] === variable &&
        Array.isArray(block.inputs.VALUE[1]),
    );
    if (!attack) throw new Error(`Missing ${NAMI.referenceCharacter} ${variable}`);
    return Number(attack.inputs.VALUE[1][1]) * NAMI.powerMultiplier;
  };
  const balance = { power: attackValue('power X'), vertical: attackValue('power Y') };

  configureAttack(project, balance);
  configureRoster(project);
  configureUnlock(project);
  configureSaveCodes(project);
  return balance;
}

function configureAttack(project, balance) {
  const nami = targetNamed(project, 'nami');
  const template = targetNamed(project, 'asta');
  const localVelocity = variableNamed(project, nami, 'vel x');
  const templateVelocity = variableNamed(project, template, 'vel x');
  const replacements = {
    asta: 'nami',
    summon_asta: 'summon_nami',
    [broadcastNamed(project, 'summon_asta')[1]]: broadcastNamed(project, 'summon_nami')[1],
    ammo_asta: 'ammo_Nami',
    cd_asta: 'cd_Nami',
    [variableNamed(project, template, 'ammo_asta')[1]]: variableNamed(
      project,
      nami,
      'ammo_Nami',
    )[1],
    [variableNamed(project, template, 'cd_asta')[1]]: variableNamed(project, nami, 'cd_Nami')[1],
    [templateVelocity[1]]: localVelocity[1],
  };

  // Replace the unfinished copied Itadori script with an existing working melee-hit sequence.
  nami.blocks = {};
  for (const [index, id] of Object.keys(template.blocks)
    .filter((key) => template.blocks[key].topLevel)
    .entries()) {
    const root = cloneGraph(template, nami, id, `nami:attack:${index}`, replacements, true);
    nami.blocks[root].topLevel = true;
  }
  const builder = new ScratchBlocks(project, nami, 'nami:attack:guard');
  const summon = findHat(nami, 'event_whenbroadcastreceived', 'summon_nami');
  const body = nami.blocks[summon].next;
  const guard = builder.if(
    builder.equals(builder.variable('char_nami_yn'), builder.literal(1)),
    body,
  );
  nami.blocks[summon].next = guard;
  nami.blocks[guard].parent = summon;

  for (const block of Object.values(nami.blocks)) {
    if (block.opcode === 'data_setvariableto' && block.fields.VARIABLE[0] === 'ammo_Nami') {
      block.inputs.VALUE = builder.literal(NAMI.ammo);
    }
    if (block.opcode === 'data_changevariableby' && block.fields.VARIABLE[0] === 'power X') {
      block.inputs.VALUE = builder.literal(balance.power);
    }
    if (block.opcode === 'data_setvariableto' && block.fields.VARIABLE[0] === 'power Y') {
      block.inputs.VALUE = builder.literal(balance.vertical);
    }
    if (block.opcode === 'operator_add') block.inputs.NUM2 = builder.literal(NAMI.cooldownSeconds);
  }
}

function configureRoster(project) {
  const skillbar = targetNamed(project, 'skillbar');
  const builder = new ScratchBlocks(project, skillbar, 'nami:roster');
  const rosterEntry = Object.entries(skillbar.blocks).find(
    ([, block]) =>
      block.opcode === 'control_if' &&
      skillbar.blocks[block.inputs.CONDITION?.[1]]?.inputs.OPERAND2?.[1]?.[1] ===
        String(NAMI.rosterPosition),
  );
  if (!rosterEntry) throw new Error('Missing final Nami roster entry');
  const entryIds = graphIds(skillbar, rosterEntry[0], false);
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
      block.inputs.X = builder.literal(NAMI.rosterX);
      block.inputs.Y = builder.literal(NAMI.rosterY);
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
  rosterLoop.inputs.TIMES = builder.literal(NAMI.rosterPosition);

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

function configureUnlock(project) {
  const tasks = targetNamed(project, 'tasks');
  const builder = new ScratchBlocks(project, tasks, 'nami:task');
  builder.append(
    findHat(tasks, 'event_whenflagclicked'),
    builder.set('task_nami_complete', builder.literal(0)),
  );
  const distance = builder.reporter(
    builder.block('operator_gt', {
      OPERAND1: builder.variable('Distance:'),
      OPERAND2: builder.literal(NAMI.unlock.distanceExclusive),
    }),
  );
  const usedLuffy = builder.reporter(
    builder.block(
      'data_listcontainsitem',
      {
        ITEM: builder.literal(NAMI.unlock.characterUsed),
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

function configureSaveCodes(project) {
  const save = targetNamed(project, 'Save');
  const load = targetNamed(project, 'Load');
  const saveBuilder = new ScratchBlocks(project, save, 'nami:save');
  const saveDefinition = procedureDefinition(save, 'Create save code');
  const joined = saveBuilder.reporter(
    saveBuilder.block('operator_join', {
      STRING1: saveBuilder.variable('Save Code:'),
      STRING2: saveBuilder.literal(NAMI.saveToken),
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
      STRING2: loadBuilder.literal(NAMI.saveToken),
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

function addInfoCostume(archive, project, name, lines) {
  const height = 12 + lines.length * 15;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="164" height="${height}" viewBox="0 0 164 ${height}">
    <rect width="164" height="${height}" rx="3" fill="#35302a" stroke="#e9bf52"/>
    <g fill="#fff" font-family="sans-serif" font-size="10">${lines
      .map(
        (line, index) =>
          `<text x="7" y="${17 + index * 15}"${index === 0 ? ' fill="#ffd766" font-weight="bold"' : ''}>${line}</text>`,
      )
      .join('')}</g></svg>`;
  const hash = createHash('md5').update(svg).digest('hex');
  archive.file(`${hash}.svg`, svg);
  targetNamed(project, 'info').costumes.push({
    name,
    assetId: hash,
    md5ext: `${hash}.svg`,
    dataFormat: 'svg',
    bitmapResolution: 1,
    rotationCenterX: 0,
    rotationCenterY: 0,
  });
}

function addRewardDescription(archive, project) {
  const costume = targetNamed(project, 'anime').costumes.find((item) => item.name === 'nami');
  // The original reward art is retained; add the requested quote to that same card.
  const original = archive.file(costume.md5ext);
  return original.async('string').then((svg) => {
    const updated = svg.replace(
      '</svg>',
      `<text x="237" y="436" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="bold" fill="#ffe274" stroke="#201a0d" stroke-width="0.5">${NAMI.description}</text></svg>`,
    );
    const hash = createHash('md5').update(updated).digest('hex');
    archive.file(`${hash}.svg`, updated);
    Object.assign(costume, { assetId: hash, md5ext: `${hash}.svg` });
  });
}
