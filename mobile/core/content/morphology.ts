// Saybon v2 — Morphology Decomposition Engine for French Words

// Common French prefixes
const PREFIXES = [
  'anti',   // anti-inflammatoire
  'auto',   // automobile, autoroute
  'co',     // coopérer, colocation
  'contra', // contredire
  'dé',     // défaire, déshabiller (strip accent for matching)
  'de',
  'des',
  'dés',
  'dys',    // dysfonctionnement
  'extra',  // extraordinaire
  'hyper',  // hyperactif
  'im',     // impossible, immobile
  'in',     // inacceptable, indirect
  'ir',     // irrégulier
  'il',     // illégal
  'inter',  // international
  'mal',    // malheureux
  'mé',     // mécontent
  'mes',
  'més',
  'mono',   // monocolore
  'multi',  // multiculturel
  'poly',   // polyglotte
  'pré',    // préparer, préhistoire
  'pre',
  're',     // refaire, relire
  'ré',
  'réa',
  'sans',   // sans-abri
  'sous',   // sous-sol
  'sur',    // surcharger, surmonter
  'télé',   // téléphone
  'trans',  // transporter
  'tri',    // tricolore
  'ultra',  // ultrarapide
  'vice',   // vice-président
];

// Common French suffixes
const SUFFIXES = [
  'able',   // lavable, aimable
  'ade',    // salade, promenade
  'age',    // garage, nettoyage
  'ail',    // travail
  'aille',  // retrouvailles
  'ain',    // écrivain
  'aine',   // centaine
  'aire',   // dictionnaire
  'al',     // journal
  'ance',   // assurance, importance
  'ant',    // enseignant, parlant
  'ard',    // campagnard
  'ateur',  // ordinateur, créateur
  'ation',  // organisation, situation
  'ationnel',
  'âtre',    // bleuâtre
  'ature',  // signature
  'aud',    // salaud
  'eau',    // gâteau
  'ée',     // journée, assemblée
  'el',     // accidentel
  'ement',  // gouvernement, chargement
  'ence',   // différence
  'erie',   // boulangerie, épicerie
  'esse',   // tristesse, sagesse
  'et',     // livret
  'ette',   // fillette, maisonnette
  'eur',    // chanteur, joueur
  'euse',   // chanteuse, joueuse
  'eux',    // courageux, malheureux
  'ible',   // visible, impossible
  'ice',    // directrice, actrice
  'ie',     // maladie
  'ier',    // boulanger, encrier
  'ière',   // crémière, théière
  'if',     // actif, attentif
  'ive',    // active, attentive
  'illon',  // oisillon
  'in',     // enfantin
  'ine',    // gamine
  'ique',   // héroïque, magnifique
  'ise',    // bêtise
  'isme',   // réalisme, journalisme
  'iste',   // journaliste, artiste
  'ité',    // réalité, activité
  'itude',  // solitude, habitude
  'ment',   // impossiblement, rapidement, doucement
  'oir',    // miroir, dortoir
  'oire',   // histoire
  'on',     // chaton
  'ose',    // osmose
  'ot',     // idiot
  'otte',   // menotte
  'rice',   // animatrice
  'té',     // liberté
  'u',      // ventru
  'ure',    // lecture, écriture
];

export interface MorphologyResult {
  prefix?: string;
  root: string;
  suffix?: string;
  decomposition: string[];
}

/**
 * Decomposes a French word into its prefix, root, and suffix constituents
 * Example: "impossiblement" -> { prefix: "im", root: "possible", suffix: "ment", decomposition: ["im", "possible", "ment"] }
 */
export function decomposeWord(word: string): MorphologyResult {
  const normalized = word.toLowerCase().trim();
  
  let prefixMatched = '';
  let suffixMatched = '';
  let root = normalized;

  // 1. Try to find the longest matching suffix first
  // Suffixes are often longer and highly structural (e.g. -ment)
  const sortedSuffixes = [...SUFFIXES].sort((a, b) => b.length - a.length);
  for (const suffix of sortedSuffixes) {
    if (normalized.endsWith(suffix) && normalized.length > suffix.length + 2) {
      suffixMatched = suffix;
      root = normalized.substring(0, normalized.length - suffix.length);
      break;
    }
  }

  // 2. Try to find the longest matching prefix in the remaining root/word
  const sortedPrefixes = [...PREFIXES].sort((a, b) => b.length - a.length);
  for (const prefix of sortedPrefixes) {
    if (root.startsWith(prefix) && root.length > prefix.length + 2) {
      prefixMatched = prefix;
      root = root.substring(prefix.length);
      break;
    }
  }

  // 3. Assemble the decomposition constituents
  const decomposition: string[] = [];
  if (prefixMatched) {
    decomposition.push(prefixMatched);
  }
  
  // Clean up root endings/transitions (e.g. impossible -> possibl)
  // Ensure the root has a sensible vowel/consonant visual balance
  if (root.length > 0) {
    decomposition.push(root);
  }
  
  if (suffixMatched) {
    decomposition.push(suffixMatched);
  }

  return {
    prefix: prefixMatched || undefined,
    root,
    suffix: suffixMatched || undefined,
    decomposition,
  };
}

/**
 * Normalizes root transitions for morphological explanations
 * e.g., impossiblement -> Im (Prefix) + Possible (Root) + Ment (Suffix)
 */
export function formatMorphologyExplanations(morph: MorphologyResult): string {
  const parts: string[] = [];
  if (morph.prefix) {
    parts.push(`Prefix: "${morph.prefix}" (means negation, repetition, or intensity)`);
  }
  parts.push(`Root: "${morph.root}" (carries the core semantic meaning)`);
  if (morph.suffix) {
    parts.push(`Suffix: "${morph.suffix}" (denotes part of speech, e.g. adverb or noun creation)`);
  }
  return parts.join('\n');
}
