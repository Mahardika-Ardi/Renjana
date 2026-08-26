import { Heart, Infinity, Target, Lock, Pen } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-red-600">Renjana</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <button className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium">
                  Sign In
                </button>
              </Link>
              <Link href="/register">
                <button className="px-4 py-2 bg-amber-700 text-white rounded-full hover:bg-amber-800 font-medium">
                  Sign Up
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-lg overflow-hidden h-96 md:h-125 bg-gray-300">
            {/* Background image placeholder */}
            <div className="absolute inset-0 bg-linear-to-b from-amber-100 via-amber-50 to-slate-100">
              <Image
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c"
                alt="picture"
                width={100}
                height={100}
              />
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/20"></div>

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center text-white px-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                Your Personal <span className="text-amber-200">Sanctuary</span>{' '}
                in a Distracted World
              </h1>
              <p className="text-lg md:text-xl max-w-2xl mb-8 text-gray-100">
                Renjana is a meditative digital space. It is an intentional
                retreat designed to settle your mind, align your heart, and
                nurture your intention.
              </p>
              <div className="flex gap-4 flex-wrap justify-center">
                <button className="px-6 py-3 bg-amber-700 hover:bg-amber-800 text-white rounded-full font-semibold transition-colors">
                  Begin Your Journey →
                </button>
                <button className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-full font-semibold transition-colors border border-white/40">
                  Explore Features
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="px-4 pb-16">
        <div className="max-w-6xl mx-auto flex justify-center gap-8 text-gray-600 border-b border-gray-200 pb-4">
          <button className="hover:text-gray-900 font-medium text-amber-700">
            Sanctuary
          </button>
          <button className="hover:text-gray-900 font-medium">
            Experiences
          </button>
          <button className="hover:text-gray-900 font-medium">Store</button>
          <button className="hover:text-gray-900 font-medium">Journal</button>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="px-4 py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-gray-600 mb-2">
              THE PHILOSOPHY
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Designed for breathability, not engagement.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Intentional Focus
              </h3>
              <p className="text-gray-600">
                Tools that guide your attention rather than demanding it. Every
                feature is crafted to reduce cognitive load and enhance
                presence.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-amber-100 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center mb-6">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Emotional Resonance
              </h3>
              <p className="text-gray-700">
                A visual language rooted in organic minimalism. Warmth, space,
                and quiet luxury define the interactions, making you feel at
                home.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center mb-6">
                <Infinity className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Holistic Harmony
              </h3>
              <p className="text-gray-600">
                Seamlessly integrate your goals, journals, and daily rhythms
                into a single, coherent narrative that supports your well-being.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Practice Section */}
      <section className="px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <div className="relative">
              <div className="rounded-lg overflow-hidden h-96 bg-gray-300">
                <Image
                  src="https://images.unsplash.com/photo-1507842696312-5c165b081193"
                  alt="Journal"
                  className="w-full h-full object-cover"
                  height={100}
                  width={100}
                />
              </div>
              {/* Floating card */}
              <div className="absolute -bottom-6 -right-6 bg-white rounded-lg shadow-lg p-4 max-w-xs">
                <p className="text-xs font-semibold text-gray-500 mb-2">
                  DAILY INSIGHT
                </p>
                <p className="text-gray-700 italic">
                  &quot;Clarity comes not from adding more, but from dropping
                  away the non-essential.&quot;
                </p>
              </div>
            </div>

            {/* Content */}
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-4">
                THE PRACTICE
              </p>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                A Canvas for Your Inner Dialogue.
              </h2>
              <p className="text-gray-600 mb-8 text-lg">
                Step into a private space designed for reflection. Our journal
                interface is stripped of metrics and social noise, offering only
                a blank page and the quiet support you need to process your day.
              </p>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-1">
                    <Pen className="w-4 h-4 text-amber-700" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Guided Reflections
                    </h4>
                    <p className="text-sm text-gray-600">
                      Gentle prompts to begin.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-1">
                    <Lock className="w-4 h-4 text-amber-700" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Absolute Privacy
                    </h4>
                    <p className="text-sm text-gray-600">
                      Your thoughts, secured.
                    </p>
                  </div>
                </div>
              </div>

              <button className="mt-8 px-6 py-3 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-full font-semibold transition-colors">
                Experience the Journal
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 bg-gray-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ready to find your center?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join a community of individuals choosing intention over impulse.
            Create your sanctuary today.
          </p>
          <button className="px-8 py-3 bg-amber-700 hover:bg-amber-800 text-white rounded-full font-semibold transition-colors inline-block">
            Start Your Free Trial
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-white mb-4">Sanctuary</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    How it Works
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Experiences</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    Courses
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Workshops
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Community</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Stories
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-sm text-center">
            <p>&copy; 2024 Renjana. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
