// SayBon — TEF Skill Tag Taxonomy
// Closed, fixed vocabulary. The content generator MAY NOT invent tags outside
// this list — the QA gate in scripts/tef/validateItems.ts rejects anything else.

export const CE_SKILL_TAGS = [
  'inference',
  'detail-scan',
  'main-idea',
  'connecteurs-logiques',
  'reference-anaphorique',
  'register-detection',
  'false-friend',
  'negation',
  'temporal-sequence',
  'author-stance',
  'lexical-precision',
] as const;

export const GRAMMAR_SKILL_TAGS = [
  'subjonctif',
  'temps-du-passe',
  'pronoms-relatifs',
  'pronoms-complements',
  'accord',
  'prepositions',
  'articles-partitifs',
  'conditionnel',
  'gerondif',
  'concordance-des-temps',
] as const;

export const EE_SKILL_TAGS = [
  'structure-argumentative',
  'articulateurs',
  'richesse-lexicale',
  'registre',
  'longueur-consigne',
  'coherence',
  'orthographe-grammaticale',
] as const;

export const ALL_SKILL_TAGS = [
  ...CE_SKILL_TAGS,
  ...GRAMMAR_SKILL_TAGS,
  ...EE_SKILL_TAGS,
] as const;

export type SkillTag = (typeof ALL_SKILL_TAGS)[number];

export function isValidSkillTag(tag: string): tag is SkillTag {
  return (ALL_SKILL_TAGS as readonly string[]).includes(tag);
}
