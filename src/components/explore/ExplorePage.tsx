import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MorphologyNode {
  type: 'Prefix' | 'Suffix';
  form: string;
  meaning: string;
  exampleFr: string;
  exampleEn: string;
}

const MORPHOLOGY_DB: MorphologyNode[] = [
  { type: 'Prefix', form: 'im- / in- / il- / ir-', meaning: 'Opposite, not, negation', exampleFr: 'impossible (impossible), illégal (illegal)', exampleEn: 'not possible, not legal' },
  { type: 'Prefix', form: 're- / r-', meaning: 'Repetition, redo, or return to state', exampleFr: 'refaire (to redo), réécrire (to rewrite)', exampleEn: 'to do again, to write again' },
  { type: 'Prefix', form: 'dé- / des-', meaning: 'Undoing, removal, reverse action', exampleFr: 'découdre (to unstitch), déshabiller (to undress)', exampleEn: 'reverse of sewing, reverse of dressing' },
  { type: 'Prefix', form: 'co- / con- / col-', meaning: 'With, together, collaboration', exampleFr: 'collaborer (to collaborate), coexister (to coexist)', exampleEn: 'work together, exist together' },
  { type: 'Suffix', form: '-ment', meaning: 'Forms adverbs from adjectives (equivalent to "-ly")', exampleFr: 'rapidement (quickly), heureusement (happily)', exampleEn: 'in a quick manner, in a happy manner' },
  { type: 'Suffix', form: '-able / -ible', meaning: 'Capability or worthiness (equivalent to "-able")', exampleFr: 'mangeable (edible), lisible (readable)', exampleEn: 'able to be eaten, able to be read' },
  { type: 'Suffix', form: '-age', meaning: 'Forms nouns of action, product, or state', exampleFr: 'lavage (washing), apprentissage (learning)', exampleEn: 'the action of washing, the process of learning' },
  { type: 'Suffix', form: '-ette', meaning: 'Diminutive (makes it smaller or feminine)', exampleFr: 'fillette (little girl), maisonnette (small cottage)', exampleEn: 'small girl, small house' }
];

interface QuebecTerm {
  word: string;
  translation: string;
  description: string;
  exampleFr: string;
  exampleEn: string;
}

const QUEBEC_DICT: QuebecTerm[] = [
  { word: 'Magasiner', translation: 'To go shopping', description: 'Replaces the European "faire du shopping" or "faire les magasins" with a direct verb rooted in the French language.', exampleFr: 'J\'adore magasiner pendant les soldes.', exampleEn: 'I love going shopping during sales.' },
  { word: 'Avoir du fun', translation: 'To have fun', description: 'Extremely common casual expression, adapting the English word "fun" directly into French grammar.', exampleFr: 'Viens avec nous, on va avoir du fun!', exampleEn: 'Come with us, we\'re going to have fun!' },
  { word: 'La fin de semaine', translation: 'The weekend', description: 'Replaces the Anglicized "le week-end" with the literal French translation, highly standardized in Québec.', exampleFr: 'Qu\'est-ce que tu fais pour la fin de semaine?', exampleEn: 'What are you doing for the weekend?' },
  { word: 'Chum & Blonde', translation: 'Boyfriend/Girlfriend (or Friend)', description: '"Chum" (pronounced exactly like the English word) means boyfriend or male friend. "Blonde" means girlfriend.', exampleFr: 'C\'est mon chum et sa blonde.', exampleEn: 'That is my boyfriend and his girlfriend.' },
  { word: 'C\'est tiguidou!', translation: 'It\'s all good / Perfect!', description: 'A colorful, purely Québécois colloquialism expressing agreement, satisfaction, or that everything is running perfectly.', exampleFr: 'Le projet est fini? Tiguidou!', exampleEn: 'The project is finished? Excellent!' },
  { word: 'Barré', translation: 'Locked', description: 'Commonly used in Québec instead of "verrouillé" to describe doors, gates, or locks.', exampleFr: 'La porte arrière est barrée.', exampleEn: 'The back door is locked.' }
];

export function ExplorePage() {
  const [activeTab, setActiveTab] = useState<'anatomy' | 'quebec'>('anatomy');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMorphology = MORPHOLOGY_DB.filter(
    (item) =>
      item.form.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.meaning.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredQuebec = QUEBEC_DICT.filter(
    (item) =>
      item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.translation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] px-4 py-8 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <header className="mb-8 mt-4">
        <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
          Explore French Intuition
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Wander through word building blocks, prefix meanings, and practical Québécois terms.
        </p>
      </header>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-[var(--color-border)] mb-6">
        <button
          onClick={() => { setActiveTab('anatomy'); setSearchQuery(''); }}
          className={`pb-3 text-sm font-semibold tracking-wider uppercase border-b-2 px-4 transition-all ${
            activeTab === 'anatomy'
              ? 'border-[var(--color-primary)] text-[var(--color-text-primary)]'
              : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          Word Anatomy (Morphology)
        </button>
        <button
          onClick={() => { setActiveTab('quebec'); setSearchQuery(''); }}
          className={`pb-3 text-sm font-semibold tracking-wider uppercase border-b-2 px-4 transition-all ${
            activeTab === 'quebec'
              ? 'border-[var(--color-primary)] text-[var(--color-text-primary)]'
              : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          Québec Expressions
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${activeTab === 'anatomy' ? 'prefixes or suffixes...' : 'Québec phrases...'}`}
          className="w-full px-4 py-3 border border-[var(--color-border)] rounded-[var(--radius-sm)] bg-[var(--color-bg-card)] text-[var(--color-text-primary)] focus:ring-1 focus:ring-[var(--color-primary)] text-sm"
        />
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {activeTab === 'anatomy' ? (
          <motion.div
            key="anatomy-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {filteredMorphology.map((item, idx) => (
              <div
                key={idx}
                className="p-5 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] shadow-sm hover:border-[var(--color-primary)] transition-all duration-200"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xl font-mono font-bold tracking-tight text-[var(--color-text-primary)]">
                    {item.form}
                  </span>
                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded tracking-wider ${
                    item.type === 'Prefix' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {item.type}
                  </span>
                </div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                  Meaning: <span className="font-normal text-[var(--color-text-secondary)]">{item.meaning}</span>
                </p>
                <div className="p-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-xs mt-2 italic">
                  <p className="font-bold not-italic mb-1 text-[var(--color-text-primary)]">Example:</p>
                  <p className="text-[var(--color-text-primary)] font-semibold">"{item.exampleFr}"</p>
                  <p className="text-[var(--color-text-secondary)] mt-0.5">translates to: {item.exampleEn}</p>
                </div>
              </div>
            ))}
            {filteredMorphology.length === 0 && (
              <p className="text-sm text-[var(--color-text-secondary)] text-center col-span-2 py-8">
                No morphology blocks found matching your query.
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="quebec-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {filteredQuebec.map((item, idx) => (
              <div
                key={idx}
                className="p-5 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-[var(--radius-sm)] shadow-sm hover:border-[var(--color-primary)] transition-all duration-200"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>
                    {item.word}
                  </h3>
                  <span className="text-xs font-semibold text-[var(--color-primary)] uppercase tracking-wider">
                    {item.translation}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
                  {item.description}
                </p>
                <div className="p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-xs italic">
                  <p className="font-bold not-italic mb-1 text-[var(--color-text-primary)]">In conversation:</p>
                  <p className="text-[var(--color-text-primary)] font-semibold">"{item.exampleFr}"</p>
                  <p className="text-[var(--color-text-secondary)] mt-0.5">"{item.exampleEn}"</p>
                </div>
              </div>
            ))}
            {filteredQuebec.length === 0 && (
              <p className="text-sm text-[var(--color-text-secondary)] text-center py-8">
                No Québec terms found matching your query.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
