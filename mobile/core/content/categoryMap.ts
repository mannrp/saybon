// Saybon v2 — Predefined Vocabulary Category Mapping
// Maps dictionary nouns/words offline using robust lookup tables and keyword matching.

export interface CategoryEntry {
  id: string; // matches Category ID
  name: string; // French name
  englishName: string; // English name
  keywords: string[]; // List of keywords (English and French substring matches) to map concepts automatically
  conceptIds?: string[]; // Specific concept overrides
}

export const categories: CategoryEntry[] = [
  {
    id: 'food',
    name: 'Nourriture & Repas',
    englishName: 'Food & Meals',
    keywords: [
      'pomme', 'pain', 'soupe', 'fromage', 'chocolat', 'tarte', 'salade', 'dîner', 'déjeuner',
      'repas', 'légume', 'fruit', 'pomme de terre', 'viande', 'poisson', 'sucre', 'sel', 'café',
      'thé', 'lait', 'eau', 'jus', 'riz', 'pâtes', 'poulet', 'œuf', 'beurre', 'sel', 'poivre',
      'biscuit', 'croissant', 'baguette', 'gâteau', 'dîner', 'petit-déjeuner'
    ],
    conceptIds: ['a1-016'] // kitchen, etc.
  },
  {
    id: 'vehicles',
    name: 'Transport & Véhicules',
    englishName: 'Transport & Vehicles',
    keywords: [
      'voiture', 'train', 'métro', 'vélo', 'bicyclette', 'avion', 'bateau', 'bus', 'autobus',
      'gare', 'aéroport', 'station', 'route', 'rue', 'chemin', 'voyage', 'voyager', 'conduire',
      'ticket', 'billet', 'taxi', 'vol'
    ]
  },
  {
    id: 'clothes',
    name: 'Vêtements & Mode',
    englishName: 'Clothes & Fashion',
    keywords: [
      'robe', 'chemise', 'pantalon', 'jupe', 'veste', 'manteau', 'chapeau', 'chaussure', 'chaussette',
      'gant', 'écharpe', 'sac', 'porter', 's’habiller', 'habit', 'vêtement', 'couleur', 'laine',
      'coton', 'jean', 'costume'
    ]
  },
  {
    id: 'bakery',
    name: 'La Boulangerie',
    englishName: 'The Bakery',
    keywords: [
      'boulangerie', 'boulanger', 'pain', 'croissant', 'baguette', 'pâtisserie', 'gâteau', 'biscuit',
      'tarte', 'farine', 'levure', 'chocolatine', 'brioche', 'four', 'cuire'
    ]
  },
  {
    id: 'school',
    name: 'École & Éducation',
    englishName: 'School & Education',
    keywords: [
      'école', 'classe', 'étudiant', 'élève', 'professeur', 'enseignant', 'livre', 'cahier', 'stylo',
      'crayon', 'devoir', 'leçon', 'apprendre', 'étudier', 'lire', 'écrire', 'examen', 'cours',
      'bibliothèque', 'université', 'tableau', 'carte', 'langue', 'mot', 'phrase'
    ]
  },
  {
    id: 'home',
    name: 'Maison & Mobilier',
    englishName: 'Home & Furniture',
    keywords: [
      'maison', 'appartement', 'chambre', 'cuisine', 'salle de bain', 'salon', 'jardin', 'porte',
      'fenêtre', 'table', 'chaise', 'lit', 'meuble', 'lampe', 'mur', 'clé', 'télé', 'miroir',
      'douche', 'frigo', 'tapis'
    ],
    conceptIds: ['a1-013', 'a1-014', 'a1-015', 'a1-016', 'a1-017', 'a1-018', 'a1-019', 'a1-020', 'a1-021', 'a1-022', 'a1-023', 'a1-024']
  },
  {
    id: 'nature',
    name: 'Nature & Animaux',
    englishName: 'Nature & Animals',
    keywords: [
      'chien', 'chat', 'animal', 'arbre', 'fleur', 'plante', 'jardin', 'forêt', 'mer', 'lac',
      'rivière', 'montagne', 'ciel', 'soleil', 'lune', 'étoile', 'vent', 'pluie', 'neige',
      'oiseau', 'cheval', 'poisson', 'terre', 'herbe'
    ]
  }
];

/**
 * Categorize a concept node based on keywords or exact matches
 */
export function getConceptCategory(french: string, english: string, conceptId: string): string | null {
  const fLower = french.toLowerCase().trim();
  const eLower = english.toLowerCase().trim();

  for (const cat of categories) {
    // Check specific manual overrides
    if (cat.conceptIds && cat.conceptIds.includes(conceptId)) {
      return cat.id;
    }

    // Check keyword matches in French or English
    const hasMatch = cat.keywords.some(
      (keyword) =>
        fLower.includes(keyword.toLowerCase()) ||
        eLower.includes(keyword.toLowerCase())
    );

    if (hasMatch) {
      return cat.id;
    }
  }

  return null;
}
