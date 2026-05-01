import Image from 'next/image'

const SHELF_SCAN_STEPS = [
  { src: '/images/blog/shelf-scan/step-1-my-shelf.jpg',      caption: '1 · Open My Shelf' },
  { src: '/images/blog/shelf-scan/step-2-photo-preview.jpg', caption: '2 · Crop & Scan'   },
  { src: '/images/blog/shelf-scan/step-3-books-found.jpg',   caption: '3 · Confirm books' },
  { src: '/images/blog/shelf-scan/step-4-shelf-result.jpg',  caption: '4 · Shelf ready'   },
]

export function ShelfScanScreenshots() {
  return (
    <div className="not-prose grid grid-cols-4 gap-2 my-6">
      {SHELF_SCAN_STEPS.map((step, i) => (
        <figure key={i} className="m-0 text-center">
          <Image
            src={step.src}
            alt={step.caption}
            width={300}
            height={650}
            className="w-full rounded-xl border border-pink-100 object-cover"
            sizes="(max-width: 640px) 45vw, 160px"
            loading={i === 0 ? 'eager' : 'lazy'}
          />
          <figcaption className="text-xs mt-1.5 text-gray-400 font-medium">
            {step.caption}
          </figcaption>
        </figure>
      ))}
    </div>
  )
}
