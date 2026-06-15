import Link from 'next/link';

const features = [
  {
    title: 'Feature Identification',
    description: 'Instantly analyze the 4Cs (Carat, Cut, Color, Clarity) of any gemstone using AI vision.',
    path: '/identification',
    icon: '🔍'
  },
  {
    title: 'Authentication',
    description: 'Determine if a gem is natural or synthetic with deep reasoning and specific markers.',
    path: '/authentication',
    icon: '🛡️'
  },
  {
    title: 'Price Estimation',
    description: 'Get an accurate market valuation based on current trends and AI analysis.',
    path: '/valuation',
    icon: '💰'
  },
  {
    title: 'Cut Prediction',
    description: 'View a 3D prediction of the most optimal cut for rough gemstones.',
    path: '/cut-prediction',
    icon: '💎'
  }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Background Decor */}
      <div className="fixed -top-40 -right-40 h-96 w-96 rounded-full bg-purple-600/20 blur-[100px]" />
      <div className="fixed -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-600/20 blur-[100px]" />

      <div className="relative mx-auto max-w-6xl px-4 py-20">
        
        {/* Hero Section */}
        <div className="mb-20 text-center">
          <h1 className="mb-6 text-5xl font-bold sm:text-6xl">
            Unlock the True Value of{' '}
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Gemstones
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-400">
            State-of-the-art AI for classification, authentication, and valuation.
            Upload an image and let GemIntel reveal its secrets.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/identification"
              className="rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-3 font-semibold transition hover:opacity-90"
            >
              Start Analysis →
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-lg border border-gray-700 px-6 py-3 font-semibold text-gray-300 transition hover:bg-gray-800"
            >
              How It Works
            </Link>
          </div>
        </div>

        {/* Features Grid - New Card Styles */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <Link
              key={i}
              href={feature.path}
              className="group flex flex-col items-center rounded-2xl bg-gradient-to-b from-gray-800 to-gray-900 p-8 text-center transition hover:from-gray-700 hover:to-gray-800 hover:-translate-y-1"
            >
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gray-700 text-3xl group-hover:bg-gray-600">
                {feature.icon}
              </div>
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-gray-400">{feature.description}</p>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}