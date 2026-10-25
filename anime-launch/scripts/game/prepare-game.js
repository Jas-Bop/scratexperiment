import JSZip from '@turbowarp/jszip';
import { CHARACTERS, getCharacter } from '../../game/characters/index.js';
import { applyCharacterSettings } from './apply-character-settings.js';
import { applyNami } from './apply-nami.js';
import { applyAccounts } from './apply-accounts.js';
import { renderCharacterCards } from './character-cards.js';

/** Build one playable project from authored character definitions and the imported engine/art. */
export async function prepareGame(projectBytes, characters = CHARACTERS) {
  const archive = await JSZip.loadAsync(projectBytes);
  const project = JSON.parse(await archive.file('project.json').async('string'));

  applyCharacterSettings(project, characters);
  applyNami(project, getCharacter('nami', characters), characters);
  applyAccounts(project);
  await renderCharacterCards(archive, project, characters);

  archive.file('project.json', JSON.stringify(project));
  return archive.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}
