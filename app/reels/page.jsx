import ReelsExtractor from '@/components/ReelsExtractor'

export const metadata = {
  title: 'Books from Videos',
  description: 'Paste a YouTube or Instagram video URL to extract every book mentioned — with suggested or not tags.',
  alternates: { canonical: '/reels' },
  openGraph: { url: '/reels' },
}

export default function ReelsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-serif text-3xl font-bold mb-2">Books from Videos</h1>
      <p className="text-slate text-sm mb-8">
        Paste a YouTube video — we&apos;ll transcribe it, extract every book mentioned,
        and tell you whether the creator suggested it or not.
      </p>
      <ReelsExtractor />
    </div>
  )
}
