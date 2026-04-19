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
  'romance', 'fantasy', 'romantasy', 'paranormal', 'science fiction',
  'dark romance', 'contemporary romance', 'rom com', 'chick lit', 'cozy', 'thriller', 'crime',
  'mystery', 'suspense', 'gothic', 'young adult', 'new adult',
  'dystopian', 'omegaverse', 'funny', 'angst', 'horror',
  'high fantasy', 'epic fantasy', 'urban fantasy', 'portal fantasy', 'grimdark', 'steampunk',
  'magic', 'time travel', 'angels', 'demons', 'fae', 'vampires', 'witches',
  'monsters', 'orcs', 'shapeshifters', 'werewolves', 'dragon shifter',
  'bear shifter', 'lion shifter', 'tiger shifter',
  'aliens',
  'domestic suspense', 'psychological thriller', 'cozy mystery', 'police procedural', 'legal thriller', 'historical thriller',
]

export const GENRE_GROUPS = {
  'Fantasy': ['fantasy', 'romantasy', 'high fantasy', 'epic fantasy', 'urban fantasy', 'portal fantasy', 'grimdark', 'steampunk'],
  'Paranormal': ['paranormal', 'magic', 'time travel', 'angels', 'demons', 'fae',
    'vampires', 'witches', 'monsters', 'orcs', 'shapeshifters', 'werewolves',
    'dragon shifter', 'bear shifter', 'lion shifter', 'tiger shifter'],
  'Sci-Fi': ['science fiction', 'aliens', 'dystopian'],
  'Thriller & Mystery': ['thriller', 'crime', 'mystery', 'suspense', 'gothic',
    'domestic suspense', 'psychological thriller', 'cozy mystery', 'police procedural', 'legal thriller', 'historical thriller'],
  'Contemporary': ['romance', 'dark romance', 'contemporary romance', 'rom com', 'chick lit', 'cozy', 'funny', 'angst'],
  'Other': ['young adult', 'new adult', 'omegaverse', 'horror'],
}

export const RELATIONSHIP_TYPES = [
  'm-f romance', 'gay romance', 'lesbian romance', 'non-binary romance',
  'queer romance', 'queer awakening', 'bisexuality',
  'poly (3+ people)', 'mmf', 'mfm', 'mff', 'mmm+', 'fff+', 'reverse harem', 'harem',
  'older/mature', 'childfree',
]

export const TROPES = [
  // opposites attract
  'age gap', 'arranged marriage', 'boss & employee', 'caretaking', 'class difference',
  'enemies to lovers', 'fake relationship', 'fated mates', 'forced proximity',
  'friends to lovers', 'friends with benefits', 'good grovel', 'grumpy & sunshine',
  'height difference', 'hurt/comfort', 'insta-love', 'marriage of convenience',
  'multicultural', 'slow burn',
  // forbidden love
  'forbidden love', "best friend's parent", "parent's best friend", 'step siblings',
  // other man/woman
  'love triangle', 'cheating',
  // romance
  'roommates', 'single parent', 'single mom', 'single dad', 'bodyguard', 'billionaire', 'celebrity/fame',
  'vacation romance', 'workplace rivals', 'workplace romance', 'amnesia', 'mistaken identity',
  'pregnancy', 'second chances', 'secret child', 'secret relationship',
  "sibling's best friend", 'bad boy', 'bully romance', 'meet cute', 'stalker romance',
  // fantasy & adventure
  'chosen one', 'prophecy', 'magic academy', 'royals/nobility', 'anti-hero',
  'redemption arc', 'heist', 'quest', 'mentor & student',
  // thriller & mystery
  'unreliable narrator', 'whodunit', 'cold case', 'fake death',
  'secret identity', 'undercover', 'killer POV',
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
  'Romance': [
    'roommates', 'single parent', 'single mom', 'single dad', 'bodyguard', 'billionaire', 'celebrity/fame',
    'vacation romance', 'workplace rivals', 'workplace romance', 'amnesia', 'mistaken identity',
    'pregnancy', 'second chances', 'secret child', 'secret relationship',
    "sibling's best friend", 'bad boy', 'bully romance', 'meet cute', 'stalker romance',
  ],
  'Fantasy & Adventure': [
    'chosen one', 'prophecy', 'magic academy', 'royals/nobility', 'anti-hero',
    'redemption arc', 'heist', 'quest', 'mentor & student',
  ],
  'Thriller & Mystery': [
    'unreliable narrator', 'whodunit', 'cold case', 'fake death',
    'secret identity', 'undercover', 'killer POV',
  ],
}

export const KINK_TAGS = [
  'fem-dom', 'masc-dom', 'role switching', 'age play', 'anal sex',
  'bdsm', 'bondage', 'spanking', 'breeding', 'consensual non-consent',
  'creative anatomy',
  'knot', 'clit stimulator', 'ridged', 'super sized', 'corkscrew',
  'vibrating', 'self-thrusting', 'hooks', 'everlasting erection', 'diphallic',
  'cock pocket', 'cock pocket penetration', 'flavorful cum', 'excessive cum', 'aphrodisiac cum',
  'daddy kink', 'double penetration', 'double anal',
  'double vaginal', 'exhibitionism', 'fetish', 'menage', 'pegging',
  'praise kink', 'primal/chase play', 'somnophilia',
]

export const STORY_TAGS = [
  'abduction', 'academy/school', 'betrayal', 'coming of age', 'cowboy', 'dark academia', 'christmas', 'cliffhanger',
  'dual pov', 'male pov', 'non-human mc',
  'cold case', 'detective/cop', 'disabilities & scars', 'dual timeline', 'espionage',
  'found family', 'locked room mystery', 'mafia', 'military', 'missing person', 'murder mystery', 'neurodivergent mc',
  'political/court intrigue', 'road trip', 'secret society', 'serial killer',
  'slavery', 'superheroes', 'survival', 'time loop', 'vengeance', 'war',
  'sports', 'baseball', 'basketball', 'fighting/mma/boxing', 'football',
  'formula 1', 'hockey', 'ice/figure skating', 'soccer',
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
  'high school', 'college', 'workplace/office', 'small town', 'city',
  'rural/countryside', 'island', 'cruise ship', 'royal court', 'magic academy',
  'fantasy world', 'hospital/medical', 'prison', 'western',
]

export const GEOGRAPHY_TAGS = [
  'africa', 'northern africa', 'eastern africa', 'middle africa', 'southern africa', 'western africa',
  'asia', 'central asia', 'east asia', 'south asia', 'southeast asia', 'western asia',
  'north america', 'usa', 'south america',
  'europe', 'british isles', 'western & central europe', 'scandinavia',
  'southern europe', 'south-east europe', 'eastern europe',
  'oceania', 'antarctica',
]
