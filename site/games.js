/** Register each game once. The dashboard, top navigation, and build use this same list. */
export const GAMES = Object.freeze([
  {
    id: 'anime-launch',
    title: 'Anime Launch',
    genre: 'LAUNCH / ARCADE',
    description: 'Time your launch, call in your crew, and see how far you can fly.',
    features: ['Unlockable characters', 'Skills & power-ups', 'Save codes'],
    projectDirectory: 'anime-launch',
    accent: '#ccff64',
    preview: 'site/assets/anime-launch-preview.png',
    previewAlt: 'Anime Launch title artwork with its stick-figure characters',
  },
  {
    id: 'polytrack',
    title: 'Polytrack',
    genre: 'RACING / TIME ATTACK',
    description: 'Find your racing line, chase your ghost, or build a circuit of your own.',
    features: ['3 original circuits', 'Personal best ghosts', 'Track editor'],
    projectDirectory: 'polytrack',
    accent: '#7ecbff',
    preview: 'site/assets/polytrack-preview.png',
    previewAlt: 'A low-poly racing car and its blue ghost driving on an alpine circuit',
  },
]);
