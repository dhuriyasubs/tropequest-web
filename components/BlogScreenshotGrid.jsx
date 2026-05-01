import Image from 'next/image'

export default function BlogScreenshotGrid({ steps }) {
  return (
    <div className="not-prose grid grid-cols-4 gap-2 my-6">
      {steps.map((step, i) => (
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
