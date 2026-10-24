/** Small build-time helpers for editing Scratch graphs without hard-coded block IDs. */
export function targetNamed(project, name) {
  const target = project.targets.find((item) => item.name === name);
  if (!target) throw new Error(`Missing Scratch target: ${name}`);
  return target;
}

export function variableNamed(project, target, name) {
  for (const scope of [target, project.targets.find((item) => item.isStage)]) {
    const match = Object.entries(scope.variables).find(([, value]) => value[0] === name);
    if (match) return [name, match[0]];
  }
  throw new Error(`Missing Scratch variable: ${name}`);
}

export function ensureVariable(project, name, value = '0') {
  const stage = project.targets.find((target) => target.isStage);
  const existing = Object.entries(stage.variables).find(([, variable]) => variable[0] === name);
  if (!existing) stage.variables[`web:${name}`] = [name, value];
}

export function broadcastNamed(project, name) {
  const stage = project.targets.find((target) => target.isStage);
  const existing = Object.entries(stage.broadcasts).find(([, value]) => value === name);
  const id = existing?.[0] ?? `web:${name}`;
  stage.broadcasts[id] = name;
  return [name, id];
}

export function findHat(target, opcode, name) {
  const match = Object.entries(target.blocks).find(([, block]) => {
    if (!block.topLevel || block.opcode !== opcode) return false;
    return !name || block.fields.BROADCAST_OPTION?.[0] === name;
  });
  if (!match) throw new Error(`Missing ${opcode} ${name ?? ''} in ${target.name}`);
  return match[0];
}

/** Collect a stack and its nested reporter/substack blocks, optionally excluding siblings. */
export function graphIds(target, start, includeNext = true) {
  const result = new Set();
  function visit(id, followNext = true) {
    if (!id || result.has(id) || !target.blocks[id]) return;
    result.add(id);
    const block = target.blocks[id];
    if (followNext) visit(block.next);
    for (const input of Object.values(block.inputs)) {
      for (const value of input.slice(1)) {
        if (typeof value === 'string') visit(value);
      }
    }
  }
  visit(start, includeNext);
  return result;
}

/** Clone a branch, preserving all parent/input links and replacing exact string values. */
export function cloneGraph(
  source,
  destination,
  start,
  prefix,
  replacements = {},
  includeNext = false,
) {
  const ids = [...graphIds(source, start, includeNext)];
  const mapping = Object.fromEntries(ids.map((id, index) => [id, `${prefix}:${index}`]));
  function replace(value) {
    if (typeof value === 'string') return mapping[value] ?? replacements[value] ?? value;
    if (Array.isArray(value)) return value.map(replace);
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, replace(child)]));
    }
    return value;
  }
  for (const id of ids) destination.blocks[mapping[id]] = replace(source.blocks[id]);
  const root = destination.blocks[mapping[start]];
  root.parent = null;
  root.topLevel = false;
  if (!includeNext) root.next = null;
  return mapping[start];
}

/** Add blocks with readable IDs; link every input and substack back to its owner. */
export class ScratchBlocks {
  constructor(project, target, prefix) {
    this.project = project;
    this.target = target;
    this.prefix = prefix;
    this.counter = 0;
  }

  block(opcode, inputs = {}, fields = {}, extra = {}) {
    const id = `${this.prefix}:${this.counter++}`;
    if (this.target.blocks[id]) throw new Error(`Duplicate generated block: ${id}`);
    this.target.blocks[id] = {
      opcode,
      next: null,
      parent: null,
      inputs,
      fields,
      shadow: false,
      topLevel: false,
      ...extra,
    };
    for (const input of Object.values(inputs)) {
      for (const value of input.slice(1)) {
        if (typeof value === 'string' && this.target.blocks[value]) {
          this.target.blocks[value].parent = id;
        }
      }
    }
    return id;
  }

  literal(value) {
    return [1, [10, String(value)]];
  }
  reporter(id) {
    return [2, id];
  }
  variable(name) {
    const [label, id] = variableNamed(this.project, this.target, name);
    return [3, [12, label, id], [10, '']];
  }
  set(name, value) {
    return this.block(
      'data_setvariableto',
      { VALUE: value },
      {
        VARIABLE: variableNamed(this.project, this.target, name),
      },
    );
  }
  equals(left, right) {
    return this.reporter(this.block('operator_equals', { OPERAND1: left, OPERAND2: right }));
  }
  and(left, right) {
    return this.reporter(this.block('operator_and', { OPERAND1: left, OPERAND2: right }));
  }
  if(condition, body) {
    return this.block('control_if', { CONDITION: condition, SUBSTACK: [2, body] });
  }
  chain(...ids) {
    for (let index = 1; index < ids.length; index++) {
      this.target.blocks[ids[index - 1]].next = ids[index];
      this.target.blocks[ids[index]].parent = ids[index - 1];
    }
    return ids[0];
  }
  append(start, addition) {
    let end = start;
    while (this.target.blocks[end].next) end = this.target.blocks[end].next;
    this.target.blocks[end].next = addition;
    this.target.blocks[addition].parent = end;
  }
}
