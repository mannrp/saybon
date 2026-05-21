// Saybon v2 — Data Migration Script
// Converts v1 vocabulary JSON files to v2 ConceptNode schema
// Automatically generates:
// 1. Programmatic word morphology decomposition
// 2. Structured examples mapping
// 3. Spherical clustered 3D coordinates based on CEFR level and part of speech

import * as fs from 'fs';
import * as path from 'path';
import { decomposeWord } from '../core/content/morphology';
import type { ConceptNode, CEFRLevel } from '../core/content/schema';

// Original v1 VocabWord interface
interface V1VocabWord {
  id: string;
  french: string;
  english: string;
  alternativeTranslations?: string[];
  gender?: 'le' | 'la' | "l'";
  partOfSpeech: 'noun' | 'verb' | 'adjective' | 'adverb' | 'other';
  exampleFr: string;
  exampleEn: string;
  level: 'A1' | 'A2';
}

/**
 * Distributes nodes in 3D space using clustered spherical coordinates
 * - Inner shell: A1 concepts
 * - Outer shell: A2 concepts
 * - Sectors (angles): Clustered by partOfSpeech to create natural constellation groupings
 */
function calculate3DCoordinates(
  level: CEFRLevel,
  partOfSpeech: string,
  index: number,
  total: number
): { x: number; y: number; z: number } {
  // Spherical radius based on CEFR Level (Inner core vs Outer shell)
  const radius = level === 'A1' ? 150 : 300;
  
  // Angle sectors by part of speech
  let baseTheta = 0; // Polar angle
  let basePhi = 0;   // Azimuth angle
  
  switch (partOfSpeech) {
    case 'noun':
      baseTheta = Math.PI / 4; // Top hemisphere
      basePhi = (index / total) * Math.PI * 2;
      break;
    case 'verb':
      baseTheta = Math.PI / 2; // Equator
      basePhi = (index / total) * Math.PI * 2;
      break;
    case 'adjective':
      baseTheta = (3 * Math.PI) / 4; // Bottom hemisphere
      basePhi = (index / total) * Math.PI * 2;
      break;
    default:
      baseTheta = Math.PI / 6; // Cap
      basePhi = (index / total) * Math.PI * 2;
      break;
  }
  
  // Add slight random jitter to prevent perfect grid alignments and make it look organic
  const jitter = 25;
  const theta = baseTheta + (Math.random() - 0.5) * 0.2;
  const phi = basePhi + (Math.random() - 0.5) * 0.2;
  
  const x = Math.round(radius * Math.sin(theta) * Math.cos(phi) + (Math.random() - 0.5) * jitter);
  const y = Math.round(radius * Math.sin(theta) * Math.sin(phi) + (Math.random() - 0.5) * jitter);
  const z = Math.round(radius * Math.cos(theta) + (Math.random() - 0.5) * jitter);
  
  return { x, y, z };
}

/**
 * Migrates a single v1 vocabulary file to v2 ConceptNode schema
 */
export function migrateVocabFile(
  inputPath: string,
  outputPath: string,
  level: CEFRLevel
) {
  try {
    const rawData = fs.readFileSync(inputPath, 'utf-8');
    const parsed = JSON.parse(rawData);
    const v1Vocab: V1VocabWord[] = Array.isArray(parsed) ? parsed : parsed.words;
    
    console.log(`Migrating ${v1Vocab.length} words from ${inputPath}...`);
    
    const v2Concepts: ConceptNode[] = v1Vocab.map((item, index) => {
      // 1. Map difficulty based on level
      const difficulty = level === 'A1' ? 0.2 : 0.4;
      
      // 2. Map gender format
      let gender: 'M' | 'F' | undefined = undefined;
      if (item.gender === 'le') gender = 'M';
      if (item.gender === 'la') gender = 'F';
      
      // 3. Programmatic morphological parsing
      const morphology = decomposeWord(item.french);
      
      // 4. Generate 3D clustered coordinate positioning
      const coordinates = calculate3DCoordinates(
        level,
        item.partOfSpeech,
        index,
        v1Vocab.length
      );
      
      return {
        id: item.id,
        type: 'word',
        difficulty,
        level,
        frequency: 60, // Default frequency index
        french: item.french,
        english: item.english,
        gender,
        morphology: morphology.decomposition.length > 1 ? morphology : undefined,
        examples: [
          {
            french: item.exampleFr,
            english: item.exampleEn,
          }
        ],
        coordinates,
      };
    });
    
    // Ensure parent directories exist
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    
    // Write out rich concept JSON seed
    fs.writeFileSync(outputPath, JSON.stringify(v2Concepts, null, 2), 'utf-8');
    console.log(`Successfully seeded ${v2Concepts.length} v2 concept nodes to ${outputPath}`);
  } catch (error) {
    console.error(`Migration failed for ${inputPath}:`, error);
  }
}

// Automatically execute migration when run via CLI/tsx
const runMigration = () => {
  const workspaceRoot = path.join(__dirname, '../..');
  
  const a1Input = path.join(workspaceRoot, 'src/data/a1-vocabulary.json');
  const a1Output = path.join(workspaceRoot, 'mobile/seed/a1-concepts.json');
  
  const a2Input = path.join(workspaceRoot, 'src/data/a2-vocabulary.json');
  const a2Output = path.join(workspaceRoot, 'mobile/seed/a2-concepts.json');
  
  console.log('--- Starting Saybon v2 Data Migration ---');
  migrateVocabFile(a1Input, a1Output, 'A1');
  migrateVocabFile(a2Input, a2Output, 'A2');
  console.log('--- Saybon v2 Data Migration Complete ---');
};

// Only auto-run if direct entry point
if (require.main === module || (process.argv[1] && process.argv[1].includes('migration'))) {
  runMigration();
}
