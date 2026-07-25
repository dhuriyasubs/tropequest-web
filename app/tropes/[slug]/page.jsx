import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import TropeBookList from '@/components/TropeBookList'
import { getFilterOptions, getBooksByTrope } from '@/lib/search'
import { slugify } from '@/lib/utils'
import { resolveSynonym } from '@/lib/taxonomy'
import PageViewTracker from '@/components/PageViewTracker'
import ShareButton from '@/components/ShareButton'

export const revalidate = 3600

// If `slug` isn't a real trope but is a known synonym (e.g. "fake-dating"), resolve
// it to the canonical trope's slug (e.g. "fake-relationship") so both the alias URL
// and the canonical URL serve the same page — alias redirects instead of 404ing.
function resolveTropeSlug(tropes, slug) {
  const direct = tropes.find(t => slugify(t) === slug)
  if (direct) return { trope: direct, canonicalSlug: slug }
  const canonical = resolveSynonym(slug.replace(/-/g, ' '))
  const canonicalSlug = slugify(canonical)
  if (canonicalSlug === slug) return { trope: null, canonicalSlug: null }
  const match = tropes.find(t => slugify(t) === canonicalSlug)
  return match ? { trope: match, canonicalSlug } : { trope: null, canonicalSlug: null }
}

// ── Editorial content for Tier 1 tropes ──────────────────────────────────────
const TROPE_EDITORIAL = {
  'enemies-to-lovers': {
    description: 'The best enemies-to-lovers books, ranked by reader rating. From slow-burn rivals to forced alliances: find your next obsession.',
    intro: 'Two people who can\'t stand each other. Tension that crackles off the page. And then something shifts. Enemies to lovers is one of the most beloved tropes in romance because the emotional payoff is unmatched. The harder the fight, the sweeter the fall.',
    whyLove: 'Readers love this trope for the push-pull dynamic, the sharp banter, and the moment the wall finally comes down. It works in every setting: high fantasy courts, rival college teams, workplace power struggles. The core tension is universal.',
    related: ['Slow Burn', 'Forced Proximity', 'Fake Relationship', 'Rivals to Lovers'],
  },
  'slow-burn': {
    description: 'The best slow burn romance books: stories where the tension builds for hundreds of pages before the payoff. Ranked by reader rating.',
    intro: 'Almost a touch. A loaded glance held a moment too long. Slow burn romance is an exercise in exquisite patience, and readers are obsessed. These are stories where the emotional intimacy builds chapter by chapter, making the eventual moment feel earned in a way that instant attraction never can.',
    whyLove: 'The beauty of slow burn is in the longing. Every almost-kiss, every restrained feeling, every page where they don\'t say what they mean. It all compounds. By the time the payoff arrives, readers have been fully invested for hundreds of pages.',
    related: ['Enemies to Lovers', 'Forced Proximity', 'Pining', 'Friends to Lovers'],
  },
  'dark-romance': {
    description: 'The best dark romance books: morally complex, intense, and not for the faint-hearted. Ranked by reader rating.',
    intro: 'Dark romance pushes boundaries. These are stories with morally grey (or outright villainous) love interests, power imbalances, and themes that mainstream romance sidesteps. They are not cautionary tales. They are fantasies that let readers explore intensity and danger from a safe distance.',
    whyLove: 'Readers come to dark romance for the thrill, the possessive alpha heroes, the enemies-with-no-redemption-arc energy. The best dark romance books pair the darkness with genuine emotional depth, making the relationship feel dangerous and earned at the same time.',
    related: ['Morally Grey Hero', 'Mafia Romance', 'Enemies to Lovers', 'Age Gap'],
  },
  'forced-proximity': {
    description: 'The best forced proximity romance books: stuck together, nowhere to run. Ranked by reader rating.',
    intro: 'Snowstorm. One bed. A cabin with no signal. Forced proximity throws two people together with no escape route and lets the tension do the rest. It\'s a trope that fast-tracks emotional intimacy by removing the option to walk away.',
    whyLove: 'What makes forced proximity so satisfying is the removal of choice. Neither character can avoid the other, which means all the feelings they\'ve been suppressing have nowhere to go. The setting becomes a pressure cooker for the relationship.',
    related: ['Enemies to Lovers', 'Slow Burn', 'Roommates', 'Fake Relationship'],
  },
  'morally-grey-hero': {
    description: 'The best books with morally grey heroes: complex, flawed, and impossible to look away from. Ranked by reader rating.',
    intro: 'He does terrible things for reasons that almost make sense. The morally grey hero is one of fiction\'s most compelling creations: a character who operates outside simple good-and-evil categories, whose choices cost something, and whose capacity for both harm and devotion makes him utterly compelling.',
    whyLove: 'Readers are drawn to morally grey heroes because they are interesting in a way that straightforwardly good characters rarely are. The tension between their actions and their feelings for the protagonist creates a push-pull that is hard to put down.',
    related: ['Dark Romance', 'Enemies to Lovers', 'Villain Romance', 'Anti-Hero'],
  },
  'found-family': {
    description: 'The best found family books: stories about the people you choose, not the ones you are born to. Fantasy, romance, and YA ranked by reader rating.',
    intro: 'Found family is the trope that turns side characters into the beating heart of a story. A ragtag crew. A group of misfits who would die for each other. People who had no one and slowly, without meaning to, became everything to a handful of strangers. It appears across fantasy, romance, and YA, and it never stops working.',
    whyLove: 'What makes found family so powerful is the element of choice. These bonds are not given, they are built, tested, and chosen again. Readers respond to the warmth of it, the safety of belonging somewhere after not belonging anywhere. When a found family is done right, losing any one of them feels like a genuine loss.',
    related: ['Fantasy', 'Chosen One', 'Forbidden Love', 'Slow Burn'],
  },
  'second-chance': {
    description: 'The best second chance romance books: first love, lost time, and the question of whether some things are worth trying again. Ranked by reader rating.',
    intro: 'They were everything to each other once. Then life happened. Second chance romance asks whether the version of love that broke you can also be the one that puts you back together. It is one of the most emotionally loaded tropes in romance, because both characters already know what is at stake.',
    whyLove: 'The power of second chance is history. These characters carry the weight of what they had, what went wrong, and what they are risking by trying again. Readers are invested from page one because the emotional backstory does half the work. When it finally comes together, it feels earned in a way that first-time love rarely does.',
    related: ['Slow Burn', 'Forbidden Love', 'Enemies To Lovers', 'Friends To Lovers'],
  },
  'second-chance-romance': {
    description: 'The best second chance romance books: first love, lost time, and the question of whether some things are worth trying again. Ranked by reader rating.',
    intro: 'They were everything to each other once. Then life happened. Second chance romance asks whether the version of love that broke you can also be the one that puts you back together. It is one of the most emotionally loaded tropes in romance, because both characters already know what is at stake.',
    whyLove: 'The power of second chance is history. These characters carry the weight of what they had, what went wrong, and what they are risking by trying again. Readers are invested from page one because the emotional backstory does half the work. When it finally comes together, it feels earned in a way that first-time love rarely does.',
    related: ['Slow Burn', 'Forbidden Love', 'Enemies To Lovers', 'Friends To Lovers'],
  },
  'marriage-of-convenience': {
    description: 'The best marriage of convenience romance books: contractual unions, unexpected feelings, and the slow unravelling of every sensible rule. Ranked by reader rating.',
    intro: 'It starts as a transaction. Two people agree to marry for reasons that have nothing to do with love: money, protection, reputation, political alliance. They set rules. They keep their distance. And then, gradually, the rules stop holding.',
    whyLove: 'Marriage of convenience works because forced proximity is built in. Two people sharing a life while pretending not to feel anything creates an unbearable slow burn. Every accidental touch, every moment of unexpected kindness, every rule broken just a little, compounds until the emotional dam gives way. Readers love the inevitability of it.',
    related: ['Fake Relationship', 'Slow Burn', 'Forced Proximity', 'Arranged Marriage'],
  },
  'cozy-fantasy': {
    description: 'The best cozy fantasy books: low-stakes magic, warm world-building, and stories that feel like a cup of tea in a soft chair. Ranked by reader rating.',
    intro: 'Not all fantasy needs a world-ending threat. Cozy fantasy trades apocalyptic stakes for intimate ones: a bakery with a secret ingredient, a small town with unusual residents, a librarian who tends to books that tend back. The magic is gentle. The danger is manageable. The warmth is the point.',
    whyLove: 'Cozy fantasy has grown enormously because readers want a fantasy experience that does not demand emotional armour. The world-building is inventive, the characters are charming, and finishing the book feels like leaving somewhere you genuinely liked being. It is comfort reading with imagination.',
    related: ['Found Family', 'Fantasy', 'Small Town', 'Friends To Lovers'],
  },
  'romantasy': {
    description: 'The best romantasy books: fantasy worlds, epic magic systems, and romance at the centre. From fae courts to dragon riders, ranked by reader rating.',
    intro: 'Romantasy puts the love story at the heart of the fantasy. Not as a subplot that the plot tolerates. Not as a reward at the end of the quest. The romance is the engine. The magic, the world, the stakes — they all exist in service of the central relationship, and the result is addictive in a way that neither pure fantasy nor pure romance quite matches.',
    whyLove: 'Readers come to romantasy for the combination of escapism. The immersive world-building of high fantasy with the emotional intensity of romance. The best romantasy books deliver both without shortchanging either: worlds that feel fully realised and relationships that feel genuinely earned. When the two elements work together, the result is nearly impossible to put down.',
    related: ['Fantasy', 'Enemies To Lovers', 'Fae', 'Forbidden Love'],
  },
  'secret-identity': {
    description: 'The best secret identity romance books: hidden pasts, double lives, and the moment the truth finally comes out. Ranked by reader rating.',
    intro: 'She doesn’t know he’s a bodyguard. He doesn’t know she’s the heiress. Secret identity romance runs on one delicious tension: someone the reader trusts is lying to the person they love, and every scene carries the weight of a confession that hasn’t happened yet. It’s a trope built entirely on dramatic irony, and readers can’t look away.',
    whyLove: 'The appeal is the slow-motion collision between who a character pretends to be and who they actually are. Readers get to know both versions before the love interest does, which makes every close call, every near-discovery, almost unbearable. When the truth finally lands, it rewrites everything that came before — and that’s the payoff secret identity delivers better than almost any other trope.',
    related: ['Cold Case', 'Mistaken Identity', 'Fake Relationship', 'Secret Relationship'],
  },
  'stalker-romance': {
    description: 'The best stalker romance books: possessive, obsessive, and unapologetically intense. Ranked by reader rating.',
    intro: 'He noticed her before she ever noticed him. Stalker romance leans all the way into obsession, following a love interest whose devotion crosses from intense into unsettling, and asks readers to sit with that discomfort as part of the fantasy. It’s dark romance at its most concentrated: possessive, watchful, and never subtle about what he wants.',
    whyLove: 'Readers come to stalker romance for the same reason they come to any villain love interest: the thrill of being wanted that completely, without the real-world consequences. The genre works because it’s explicit fantasy, not aspiration — a safe way to explore obsession, control, and devotion pushed to its most extreme edge.',
    related: ['Anti Hero', 'Bad Boy', 'Forced Proximity', 'Secret Relationship'],
  },
  'chosen-one': {
    description: 'The best chosen one fantasy books: prophecies, destinies, and heroes who never asked for any of it. Ranked by reader rating.',
    intro: 'A prophecy nobody can quite agree on the meaning of. A hero who would rather not. Chosen one stories hand a single character the weight of an entire world’s fate, then spend hundreds of pages watching them decide whether to carry it. It’s one of fantasy’s oldest structures because it still works: the stakes are automatically enormous, and the character’s arc is built right into the premise.',
    whyLove: 'What makes chosen one endure is the tension between destiny and choice. The best versions of this trope let the hero push back against the role they’ve been handed, making the eventual acceptance feel earned rather than inevitable. Readers get an underdog and an epic at the same time.',
    related: ['Prophecy', 'Magic Academy', 'Quest', 'Mentor & Student'],
  },
  'bad-boy': {
    description: 'The best bad boy romance books: rough edges, zero interest in being tamed, and a soft spot only she can find. Ranked by reader rating.',
    intro: 'He’s not looking for redemption. Bad boy romance centers a love interest who breaks rules, doesn’t apologize for it, and has no interest in becoming a better man for anyone — until he does, quietly, for her. It’s one of romance’s most durable archetypes because the contrast does all the work: the harder the exterior, the more it means when it cracks.',
    whyLove: 'Readers love the bad boy for the same reason they love enemies to lovers: the payoff is proportional to the resistance. Watching someone genuinely unbothered by anyone’s opinion get thrown off balance by one specific person is deeply satisfying, and the built-in danger keeps the tension high without needing a bigger plot to sustain it.',
    related: ['Enemies To Lovers', 'Anti Hero', 'Stalker Romance', 'Billionaire'],
  },
  'caretaking': {
    description: 'The best caretaking romance books: quiet devotion, careful hands, and love shown through the smallest gestures. Ranked by reader rating.',
    intro: 'Someone gets hurt. Someone else shows up, every day, without being asked twice. Caretaking romance is built on small, repeated acts of devotion — the tea made without asking, the ride to every appointment, the patience that never runs out — and it turns ordinary kindness into the most romantic gesture in the book.',
    whyLove: 'This trope resonates because it shows love as action rather than declaration. There’s no grand gesture required when someone consistently shows up in the unglamorous moments, and readers respond to that quiet reliability more than almost any dramatic confession. It’s slow burn’s gentler cousin, built on trust instead of tension.',
    related: ['Hurt/Comfort', 'Forced Proximity', 'Grumpy & Sunshine', 'Slow Burn'],
  },
  'bodyguard': {
    description: 'The best bodyguard romance books: professional distance, constant proximity, and a job that gets complicated fast. Ranked by reader rating.',
    intro: 'He’s paid to protect her. He is not paid to fall in love with her. Bodyguard romance puts two people in each other’s space around the clock, one of them bound by professional rules the other keeps quietly testing, and lets the tension build in every hallway, every car ride, every night shift. The job title guarantees the proximity; the chemistry does the rest.',
    whyLove: 'Readers love bodyguard romance for the built-in power dynamic and constant closeness that other tropes have to work harder to justify. It’s forced proximity with real stakes attached, since the hero’s job depends on keeping his distance, and every rule he breaks for her means something. The tension between duty and desire practically writes itself.',
    related: ['Forced Proximity', 'Celebrity/Fame', 'Fake Relationship', 'Billionaire'],
  },
}

export async function generateMetadata({ params }) {
  const { tropes } = await getFilterOptions()
  const { trope, canonicalSlug } = resolveTropeSlug(tropes, params.slug)
  if (!trope) return {}
  const editorial = TROPE_EDITORIAL[canonicalSlug]
  const description = editorial?.description
    ?? `Find the best ${trope} books on TropeQuest, sorted by rating, with covers, series info, and buy links.`
  const books = await getBooksByTrope(trope)
  return {
    title: `Best ${trope} Books`,
    description,
    alternates: { canonical: `/tropes/${canonicalSlug}` },
    robots: books.length < 8 ? { index: false, follow: true } : undefined,
    openGraph: {
      title: `Best ${trope} Books | TropeQuest`,
      description,
      url: `/tropes/${canonicalSlug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `Best ${trope} Books | TropeQuest`,
      description,
    },
  }
}

export default async function TropeDetailPage({ params }) {
  const { tropes } = await getFilterOptions()
  const { trope, canonicalSlug } = resolveTropeSlug(tropes, params.slug)
  if (!trope) notFound()
  if (canonicalSlug !== params.slug) redirect(`/tropes/${canonicalSlug}`)

  const books = await getBooksByTrope(trope)
  const editorial = TROPE_EDITORIAL[canonicalSlug]

  // Resolve related trope slugs
  const relatedTropes = (editorial?.related ?? [])
    .map(name => ({ name, slug: slugify(name), exists: tropes.includes(name) }))
    .filter(r => r.exists)

  const description = editorial?.description
    ?? `Find the best ${trope} books on TropeQuest, sorted by rating, with covers, series info, and buy links.`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Best ${trope} Books`,
    description,
    url: `https://tropequest.com/tropes/${params.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: books.length,
      itemListElement: books.slice(0, 10).map((b, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Book',
          name: b.title,
          author: { '@type': 'Person', name: b.author },
          ...(b.slug ? { url: `https://tropequest.com/books/${b.slug}` } : {}),
          ...(b.cover_url ? { image: b.cover_url } : {}),
        },
      })),
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageViewTracker pageType="trope_detail" slug={params.slug} />
      <div className="max-w-6xl mx-auto px-4 py-10">
      <Breadcrumb crumbs={[
        { label: 'Home', href: '/' },
        { label: 'Tropes', href: '/tropes' },
        { label: trope },
      ]} />

      <div className="flex items-center gap-3 mb-2">
        <h1 className="font-serif text-3xl font-bold">Best {trope} Books</h1>
        <ShareButton url={`https://tropequest.com/tropes/${params.slug}`} title={`Best ${trope} Books | TropeQuest`} />
      </div>

      {editorial ? (
        <div className="max-w-2xl mb-8">
          <p className="text-ink/80 leading-relaxed mb-3">{editorial.intro}</p>
          <p className="text-ink/70 text-sm leading-relaxed">{editorial.whyLove}</p>
        </div>
      ) : null}

      {books.length === 0 ? (
        <p className="text-slate">No books found for this trope yet.</p>
      ) : (
        <TropeBookList books={books} />
      )}

      {relatedTropes.length > 0 && (
        <div className="mt-14">
          <h2 className="font-serif text-xl font-semibold mb-4">Related Tropes</h2>
          <div className="flex flex-wrap gap-2">
            {relatedTropes.map(r => (
              <Link
                key={r.slug}
                href={`/tropes/${r.slug}`}
                className="chip text-sm"
              >
                {r.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
    </>
  )
}
