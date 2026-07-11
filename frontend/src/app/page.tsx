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
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-24 relative">
      {/* Background Decor */}
      <div className="fixed -top-40 -right-40 h-96 w-96 rounded-full bg-purple-600/10 blur-[100px] pointer-events-none" />
      <div className="fixed -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />

      {/* Hero Section */}
      <section className="mb-16 sm:mb-24 text-center">
        <h1 className="mb-6 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-white">
          Unlock the True Value of{' '}
          <span className="gradient-text">
            Gemstones
          </span>
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-base sm:text-lg text-gray-400 leading-relaxed">
          State-of-the-art AI for classification, authentication, and valuation.
          Upload gemstone photographs or input attributes to reveal their secrets.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link
            href="/identification"
            className="btn-primary px-8 py-3.5 text-sm sm:text-base w-full sm:w-auto shadow-lg"
          >
            Start Analysis →
          </Link>
          <Link
            href="/identification"
            className="btn-secondary px-8 py-3.5 text-sm sm:text-base w-full sm:w-auto shadow-lg"
          >
            How It Works
          </Link>
        </div>
      </section>

      {/* Features Grid - Glassmorphic Card Styles */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature, i) => (
          <Link
            key={i}
            href={feature.path}
            className="glass-panel group flex flex-col items-center p-6 sm:p-8 text-center transition hover:-translate-y-1.5 duration-300"
          >
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 border border-white/10 text-2xl group-hover:bg-white/10 transition-colors">
              {feature.icon}
            </div>
            <h3 className="mb-2 text-base sm:text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
              {feature.title}
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-gray-400">{feature.description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}