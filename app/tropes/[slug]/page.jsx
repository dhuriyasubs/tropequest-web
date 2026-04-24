import { notFound } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import TropeBookList from '@/components/TropeBookList'
import { getFilterOptions, getBooksByTrope } from '@/lib/search'
import { slugify } from '@/lib/utils'
import PageViewTracker from '@/components/PageViewTracker'
import ShareButton from '@/components/ShareButton'

export const revalidate = 3600

// ── Editorial content for Tier 1 tropes ──────────────────────────────────────
const TROPE_EDITORIAL = {
  'enemies-to-lovers': {
    description: 'The best enemies-to-lovers books, ranked by reader rating. From slow-burn rivals to forced alliances: find your next obsession.',
    intro: 'Two people who can\'t stand each other. Tension that crackles off the page. And then something shifts. Enemies to lovers is one of the most beloved tropes in romance because the emotional payoff is unmatched. The harder the fight, the sweeter the fall.',
    whyLove: 'Readers love this trope for the push-pull dynamic, the sharp banter, and the moment the wall finally comes down. It works in every setting: high fantasy courts, rival college teams, workplace power struggles. The core tension is universal.',
    related: ['Slow Burn', 'Forced Proximity', 'Fake Dating', 'Rivals to Lovers'],
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
    related: ['Enemies to Lovers', 'Slow Burn', 'Roommates', 'Fake Dating'],
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
    related: ['Fake Dating', 'Slow Burn', 'Forced Proximity', 'Arranged Marriage'],
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
}

export async function generateMetadata({ params }) {
  const { tropes } = await getFilterOptions()
  const trope = tropes.find(t => slugify(t) === params.slug)
  if (!trope) return {}
  const editorial = TROPE_EDITORIAL[params.slug]
  const description = editorial?.description
    ?? `Find the best ${trope} books on TropeQuest, sorted by rating, with covers, series info, and buy links.`
  const books = await getBooksByTrope(trope)
  return {
    title: `Best ${trope} Books`,
    description,
    alternates: { canonical: `/tropes/${params.slug}` },
    robots: books.length < 8 ? { index: false, follow: true } : undefined,
    openGraph: {
      title: `Best ${trope} Books | TropeQuest`,
      description,
      url: `/tropes/${params.slug}`,
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
  const trope = tropes.find(t => slugify(t) === params.slug)
  if (!trope) notFound()

  const books = await getBooksByTrope(trope)
  const editorial = TROPE_EDITORIAL[params.slug]

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
