import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWordProgress } from '../../hooks/useWordProgress';
import { useSettings } from '../../hooks/useSettings';

interface TILCard {
  id: string;
  category: 'Word Anatomy' | 'Québec French' | 'Grammar Nuance';
  title: string;
  preview: string;
  content: string;
  exampleFr?: string;
  exampleEn?: string;
}

const TIL_CARDS: TILCard[] = [
  {
    id: 'til-1',
    category: 'Word Anatomy',
    title: 'Anatomy of "impossiblement"',
    preview: 'How a simple word breaks down into prefix, root, and suffix to unlock understanding.',
    content: 'The word "impossiblement" (impossibly) is a classic example of morphological building blocks in French:\n\n• im- (prefix meaning "not/opposite")\n• possible (root adjective)\n• -ment (adverbial suffix, equivalent to "-ly" in English)\n\nBy learning these blocks, you can infer the meanings of hundreds of new adverbs without looking them up.',
    exampleFr: 'C\'est impossiblement difficile.',
    exampleEn: 'It is impossibly difficult.'
  },
  {
    id: 'til-2',
    category: 'Québec French',
    title: 'The art of "Avoir du fun"',
    preview: 'Why Québec immigrants hear this expression daily, and how it differs from European French.',
    content: 'In France, you\'ll hear "s\'amuser" or "se marrer" for having fun. In Québec, English influence has created the widely used and perfectly standard phrase "avoir du fun". It is used in all casual conversations.\n\nNote that in French, "fun" is pronounced closer to "fonne" in Québécois French.',
    exampleFr: 'On a eu bien du fun à la fin de semaine!',
    exampleEn: 'We had a lot of fun on the weekend!'
  },
  {
    id: 'til-3',
    category: 'Grammar Nuance',
    title: 'Savoir vs Connaître',
    preview: 'Never mix these up again. A clean, simple distinction between facts and familiarity.',
    content: 'Both mean "to know," but their operational rules are strict:\n\n• Savoir: Knowing a fact, information, or how to do something. Usually followed by a verb, "que", "si", or question words.\n• Connaître: Being familiar with a person, place, or thing. Always followed by a direct noun.\n\nE.g., "Je sais nager" (I know how to swim) vs. "Je connais ce restaurant" (I know this restaurant).',
    exampleFr: 'Je sais qu\'il viendra, car je connais son frère.',
    exampleEn: 'I know he will come, because I know his brother.'
  },
  {
    id: 'til-4',
    category: 'Québec French',
    title: 'Going Shopping? Let\'s "Magasiner"',
    preview: 'Learn why Québec rejects the European "faire du shopping" in favor of this elegant verb.',
    content: 'While European French heavily borrows the English gerund "faire du shopping," Québec French is highly protective of its linguistic roots and created the active verb "magasiner" (literally, "to shop-ify"). Use this in Montréal to blend in seamlessly!',
    exampleFr: 'Je vais magasiner au centre-ville.',
    exampleEn: 'I am going shopping downtown.'
  },
  {
    id: 'til-5',
    category: 'Word Anatomy',
    title: 'The repetition power of "Re-"',
    preview: 'How a two-letter prefix lets you double your action vocabulary instantly.',
    content: 'In French, adding the prefix "re-" (or "r-" before a vowel) to a verb signifies repetition or return to a previous state:\n\n• faire (to do) → refaire (to redo)\n• prendre (to take) → reprendre (to retake/resume)\n• venir (to come) → revenir (to come back)\n\nThis simple rule instantly multiplies your active vocabulary.',
    exampleFr: 'Peux-tu refaire cet exercice s\'il te plaît?',
    exampleEn: 'Can you redo this exercise please?'
  }
];

export function DashboardPage() {
  const navigate = useNavigate();
  const { progress, loading: progressLoading } = useWordProgress();
  const { settings } = useSettings();
  
  // Oracle State
  const [query, setQuery] = useState('');
  const [oracleResponse, setOracleResponse] = useState<string | null>(null);
  const [isOracleLoading, setIsOracleLoading] = useState(false);
  const [oracleError, setOracleError] = useState<string | null>(null);
  
  // Modal State for TIL cards
  const [selectedTIL, setSelectedTIL] = useState<TILCard | null>(null);

  // Statistics
  const stats = useMemo(() => {
    const totalSeen = progress.size;
    const progressList = Array.from(progress.values());
    const mastered = progressList.filter(p => p.masteryLevel >= 4).length;
    const weakCount = progressList.filter(p => p.masteryLevel <= 2 && p.attempts > 0).length;
    return { totalSeen, mastered, weakCount };
  }, [progress]);

  // Ask the Oracle
  const handleAskOracle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (!settings.gemini.apiKey) {
      setOracleError('Please add a Gemini API Key in Settings (top right) to use the linguistic Oracle.');
      return;
    }

    setIsOracleLoading(true);
    setOracleError(null);
    setOracleResponse(null);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${settings.gemini.model}:generateContent`;
      const prompt = `You are the SayBon Linguistic Oracle, an expert, friendly, and elegant guide to the French language, with a particular specialty in Québec French (Québécois) and morphological root analysis. 
Provide a clear, high-typography, elegant explanation for the following user question. Keep your answer brief (under 120 words), highly breathable with paragraphs or bullets, and use English. Avoid generic introductions. Highlight key words.

User Question: "${query}"`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': settings.gemini.apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 500,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Oracle is resting at the moment. Please verify your connection.');
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error('Oracle returned an empty response.');
      }

      setOracleResponse(text);
    } catch (err) {
      console.error(err);
      setOracleError(err instanceof Error ? err.message : 'Linguistic oracle failed.');
    } finally {
      setIsOracleLoading(false);
    }
  };

  if (progressLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)] mb-4"></div>
          <p className="text-lg text-[var(--color-text-secondary)]">Opening practice studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] px-4 py-8 max-w-4xl mx-auto pb-24">
      {/* Top Greeting Panel */}
      <header className="mb-10 mt-4">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-5xl font-bold tracking-tight text-[var(--color-text-primary)]"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Bonjour, Mann.
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.1 }}
          className="mt-2 text-md text-[var(--color-text-secondary)] tracking-wider uppercase font-medium text-xs"
        >
          {stats.totalSeen} concepts explored • {stats.mastered} mastered • Calm practice studio
        </motion.p>
      </header>

      {/* Main CTA Area */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => navigate('/practice?mode=all')}
          className="p-6 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 group flex flex-col justify-between h-48"
        >
          <div>
            <span className="text-[var(--color-primary)] font-bold text-xs uppercase tracking-widest">Main Engine</span>
            <h2 className="text-2xl font-bold mt-2" style={{ fontFamily: 'Georgia, serif' }}>Continue Practice</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mt-2">Jump straight into 10 rapid-fire vocabulary & translation cards built for recall.</p>
          </div>
          <span className="text-sm font-semibold text-[var(--color-primary)] group-hover:translate-x-1 transition-transform inline-flex items-center">
            Start Session →
          </span>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => navigate('/practice?mode=weak')}
          className="p-6 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 group flex flex-col justify-between h-48"
        >
          <div>
            <span className="text-[var(--color-weak)] font-bold text-xs uppercase tracking-widest">Reinforcement</span>
            <h2 className="text-2xl font-bold mt-2" style={{ fontFamily: 'Georgia, serif' }}>Reinforce Weak Words</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mt-2">
              Target {stats.weakCount} vocabulary items with low mastery scores.
            </p>
          </div>
          <span className="text-sm font-semibold text-[var(--color-weak)] group-hover:translate-x-1 transition-transform inline-flex items-center">
            Review Weak ({stats.weakCount}) →
          </span>
        </motion.div>
      </section>

      {/* Discovery Strip (TIL horizontal scroll) */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>Discover Something New</h3>
          <Link to="/explore" className="text-sm text-[var(--color-primary)] font-medium hover:underline">Browse Archive</Link>
        </div>
        <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 scrollbar-none snap-x snap-mandatory">
          {TIL_CARDS.map((card) => (
            <motion.div
              key={card.id}
              whileHover={{ y: -2 }}
              onClick={() => setSelectedTIL(card)}
              className="flex-shrink-0 w-72 p-5 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] cursor-pointer snap-start flex flex-col justify-between h-52 hover:border-[var(--color-primary)] transition-all duration-200"
            >
              <div>
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider text-[var(--color-primary)] bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-full uppercase">
                  {card.category}
                </span>
                <h4 className="text-lg font-bold mt-3 text-[var(--color-text-primary)] line-clamp-1" style={{ fontFamily: 'Georgia, serif' }}>
                  {card.title}
                </h4>
                <p className="text-xs text-[var(--color-text-secondary)] mt-2 line-clamp-3 leading-relaxed">
                  {card.preview}
                </p>
              </div>
              <span className="text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors mt-2">
                Tap to read →
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Ask the Oracle Section */}
      <section className="p-6 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] shadow-sm">
        <h3 className="text-xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>Ask the Oracle</h3>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          Type any sentence, translation riddle, or grammatical mystery to consult the studio's AI helper.
        </p>

        <form onSubmit={handleAskOracle} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., When do I use 'dont' vs 'que'?"
            className="flex-1 px-4 py-3 border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-sm"
          />
          <button
            type="submit"
            disabled={isOracleLoading || !query.trim()}
            className="px-5 py-3 text-sm font-semibold text-white bg-[var(--color-primary)] rounded-[var(--radius-button)] hover:bg-[var(--color-primary-hover)] disabled:bg-[var(--color-border)] transition-colors"
          >
            {isOracleLoading ? 'Consulting...' : 'Ask'}
          </button>
        </form>

        <AnimatePresence mode="wait">
          {oracleError && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 p-4 bg-[var(--color-incorrect-bg)] border border-[var(--color-incorrect-border)] rounded-[var(--radius-sm)] text-xs text-[var(--color-incorrect-text)]"
            >
              {oracleError}
            </motion.div>
          )}

          {oracleResponse && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 p-5 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-sm text-[var(--color-text-primary)] leading-relaxed relative"
            >
              <div className="absolute top-2 right-3 text-[10px] uppercase font-bold tracking-widest text-[var(--color-text-muted)]">Oracle Reply</div>
              <div className="whitespace-pre-line mt-2 font-medium" style={{ fontFamily: 'system-ui, sans-serif' }}>
                {oracleResponse}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Subtle Progress Footnote */}
      <footer className="mt-16 text-center text-xs text-[var(--color-text-muted)] border-t border-[var(--color-border)] pt-6">
        <p>SayBon Practice Studio • A highly focused environment for French mastery.</p>
        <p className="mt-1">Offline-first • Storing your progress safely on your device.</p>
      </footer>

      {/* TIL Card Deep-Dive Modal */}
      <AnimatePresence>
        {selectedTIL && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] w-full max-w-lg p-6 shadow-xl relative max-h-[85vh] overflow-y-auto"
            >
              <button
                onClick={() => setSelectedTIL(null)}
                className="absolute top-4 right-4 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-bold text-lg p-1"
              >
                ✕
              </button>

              <span className="text-[var(--color-primary)] font-bold text-xs uppercase tracking-widest">
                {selectedTIL.category}
              </span>
              
              <h3 className="text-2xl font-bold mt-2 pr-8" style={{ fontFamily: 'Georgia, serif' }}>
                {selectedTIL.title}
              </h3>

              <div className="mt-4 text-sm text-[var(--color-text-primary)] whitespace-pre-line leading-relaxed border-t border-[var(--color-border)] pt-4">
                {selectedTIL.content}
              </div>

              {selectedTIL.exampleFr && (
                <div className="mt-6 p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[var(--radius-sm)] italic">
                  <p className="text-sm font-bold text-[var(--color-text-primary)] not-italic mb-1">Example in action:</p>
                  <p className="text-sm text-[var(--color-text-primary)] font-semibold">"{selectedTIL.exampleFr}"</p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">"{selectedTIL.exampleEn}"</p>
                </div>
              )}

              <button
                onClick={() => setSelectedTIL(null)}
                className="mt-6 w-full py-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-border)] font-semibold text-xs uppercase tracking-widest text-[var(--color-text-primary)] rounded-[var(--radius-button)] transition-colors"
              >
                Close Article
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
