// TropeQuest taxonomy — canonical tag values for each books column.
// Single source of truth for all UI components and search filters.

export const SPICE_LABELS = {
  1: 'Closed Door',
  2: 'Fade to Black',
  3: 'Some Steam',
  4: 'Steamy',
  5: 'Explicit',
}

export const TIME_PERIODS = [
  'historical', 'contemporary', 'futuristic',
  'ancient times', 'medieval', 'tudors & stuarts', 'georgian',
  'regency', 'victorian', 'western frontier', 'american civil war', '20th century',
]

export const TIME_PERIOD_GROUPS = {
  'Historical': ['ancient times', 'medieval', 'tudors & stuarts', 'georgian',
    'regency', 'victorian', 'western frontier', 'american civil war', '20th century'],
  'Other': ['contemporary', 'futuristic'],
}

export const GENRES = [
  'fantasy', 'paranormal', 'science fiction', 'dark romance',
  'young adult', 'new adult', 'mystery', 'suspense', 'dystopian',
  'omegaverse', 'funny', 'angst', 'horror',
  'high fantasy', 'urban fantasy', 'steampunk',
  'magic', 'time travel', 'angels', 'demons', 'fae', 'vampires', 'witches',
  'monsters', 'orcs', 'shapeshifters', 'werewolves', 'dragon shifter',
  'bear shifter', 'lion shifter', 'tiger shifter',
  'aliens',
]

export const GENRE_GROUPS = {
  'Fantasy': ['fantasy', 'high fantasy', 'urban fantasy', 'steampunk'],
  'Paranormal': ['paranormal', 'magic', 'time travel', 'angels', 'demons', 'fae',
    'vampires', 'witches', 'monsters', 'orcs', 'shapeshifters', 'werewolves',
    'dragon shifter', 'bear shifter', 'lion shifter', 'tiger shifter'],
  'Sci-Fi': ['science fiction', 'aliens', 'dystopian'],
  'Contemporary': ['dark romance', 'funny', 'angst', 'suspense', 'mystery'],
  'Other': ['young adult', 'new adult', 'omegaverse', 'horror'],
}

export const RELATIONSHIP_TYPES = [
  'm-f romance', 'gay romance', 'lesbian romance', 'non-binary romance',
  'queer romance', 'queer awakening', 'bisexuality',
  'mmf', 'mfm', 'mff', 'mmm+', 'fff+', 'reverse harem', 'harem',
  'older/mature', 'childfree',
]

export const TROPES = [
  'age gap', 'arranged marriage', 'boss & employee', 'caretaking', 'class difference',
  'enemies to lovers', 'fake relationship', 'fated mates', 'forced proximity',
  'friends to lovers', 'friends with benefits', 'good grovel', 'grumpy & sunshine',
  'height difference', 'hurt/comfort', 'insta-love', 'marriage of convenience',
  'multicultural', 'slow burn', 'forbidden love', "best friend's parent",
  "parent's best friend", 'step siblings', 'love triangle', 'cheating',
  'pregnancy', 'second chances', 'secret child', 'secret relationship',
  "sibling's best friend",
]

export const TROPE_GROUPS = {
  'Opposites Attract': [
    'age gap', 'arranged marriage', 'boss & employee', 'caretaking', 'class difference',
    'enemies to lovers', 'fake relationship', 'fated mates', 'forced proximity',
    'friends to lovers', 'friends with benefits', 'good grovel', 'grumpy & sunshine',
    'height difference', 'hurt/comfort', 'insta-love', 'marriage of convenience',
    'multicultural', 'slow burn',
  ],
  'Forbidden Love': [
    'forbidden love', "best friend's parent", "parent's best friend", 'step siblings',
  ],
  'Other Man/Woman': ['love triangle', 'cheating'],
  'Other': ['pregnancy', 'second chances', 'secret child', 'secret relationship', "sibling's best friend"],
}

export const KINK_TAGS = [
  'fem-dom', 'masc-dom', 'role switching', 'age play', 'anal sex',
  'bdsm', 'bondage', 'spanking', 'breeding', 'consensual non-consent',
  'creative anatomy', 'daddy kink', 'double penetration', 'double anal',
  'double vaginal', 'exhibitionism', 'fetish', 'menage', 'pegging',
  'praise kink', 'primal/chase play', 'somnophilia',
]

export const STORY_TAGS = [
  'abduction', 'betrayal', 'christmas', 'cliffhanger', 'disabilities & scars',
  'found family', 'mafia', 'military', 'neurodivergent mc', 'political/court intrigue',
  'slavery', 'superheroes', 'survival', 'vengeance', 'war',
  'sports', 'baseball', 'basketball', 'fighting/mma/boxing', 'football',
  'hockey', 'ice/figure skating', 'soccer',
]

export const CONTENT_WARNINGS = [
  'no hea', 'nontraditional hea', 'ableism',
  'abuse', 'abuse between mcs', 'third party abuse', 'past abuse',
  'past child abuse', 'past child neglect', 'animal abuse', 'animal death',
  'birth-control non-consent', 'body betrayal', 'death / grief', 'child death',
  'dubious consent', 'eating disorders', 'fatphobia', 'forced pregnancy',
  'gambling', 'graphic violence', 'human trafficking', 'incest',
  'mental illness', 'mental trauma', 'miscarriage / infertility', 'misogyny',
  'queerphobia', 'racism', 'rape', 'non-consent between mcs',
  'third party sexual assault', 'past sexual abuse', 'child sexual abuse',
  'religious trauma', 'self harm', 'slut shaming', 'substance abuse',
  'alcoholism', 'drug abuse', 'suicide / ideation', 'terminal illness',
  'torture of mcs', 'torture of side characters', 'victim blaming',
]

export const REPRESENTATION = [
  'black mc', 'african-american', 'bw/wm', 'east asian mc', 'indigenous mc',
  'latinx mc', 'south asian/desi', 'southeast asian mc',
  'amish', 'buddhist', 'christian', 'hindu', 'jewish', 'muslim', 'pagan',
]

export const SETTING_TAGS = [
  'high school', 'college', 'workplace/office', 'small town', 'western',
]

export const GEOGRAPHY_TAGS = [
  'africa', 'northern africa', 'eastern africa', 'middle africa', 'southern africa', 'western africa',
  'asia', 'central asia', 'east asia', 'south asia', 'southeast asia', 'western asia',
  'north america', 'usa', 'south america',
  'europe', 'british isles', 'western & central europe', 'scandinavia',
  'southern europe', 'south-east europe', 'eastern europe',
  'oceania', 'antarctica',
]
