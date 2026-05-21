// Saybon v2 — Concept Node Relationship Graph Builder & Query Utilities
import type { ConceptNode, ConceptRelationship } from './schema';

/**
 * Programmatically builds relationship edges between concept nodes
 * by examining shared suffixes, roots, categories, and parts of speech.
 */
export function buildRelationships(nodes: ConceptNode[]): ConceptRelationship[] {
  const relationships: ConceptRelationship[] = [];
  const nodesMap = new Map<string, ConceptNode>();
  nodes.forEach((n) => nodesMap.set(n.id, n));

  for (let i = 0; i < nodes.length; i++) {
    const nodeA = nodes[i];
    
    for (let j = i + 1; j < nodes.length; j++) {
      const nodeB = nodes[j];
      
      // 1. Check for Morphological Derivations (shared roots)
      const hasSharedRoot =
        nodeA.morphology?.root &&
        nodeB.morphology?.root &&
        nodeA.morphology.root === nodeB.morphology.root;
        
      if (hasSharedRoot) {
        relationships.push({
          sourceId: nodeA.id,
          targetId: nodeB.id,
          type: 'derived',
          weight: 0.9, // High connection strength for shared roots
        });
        continue; // Skip other links if already morphologically linked
      }

      // 2. Check for category connections (shared tags in custom examples/metadata)
      const categoriesA = getConceptCategories(nodeA);
      const categoriesB = getConceptCategories(nodeB);
      const sharedCategories = categoriesA.filter((cat) => categoriesB.includes(cat));

      if (sharedCategories.length > 0) {
        // More shared categories = stronger edge weight
        const weight = Math.min(0.3 + sharedCategories.length * 0.15, 0.7);
        relationships.push({
          sourceId: nodeA.id,
          targetId: nodeB.id,
          type: 'category',
          weight,
        });
        continue;
      }
      
      // 3. Grammar connections (e.g. tense node linked to a verb word node)
      if (
        (nodeA.type === 'grammar' && nodeB.type === 'word' && nodeB.french.includes(nodeA.french)) ||
        (nodeB.type === 'grammar' && nodeA.type === 'word' && nodeA.french.includes(nodeB.french))
      ) {
        relationships.push({
          sourceId: nodeA.id,
          targetId: nodeB.id,
          type: 'grammar',
          weight: 0.8,
        });
      }
    }
  }

  return relationships;
}

/**
 * Extracts categories/topics associated with a concept node
 */
export function getConceptCategories(node: ConceptNode): string[] {
  const categories: Set<string> = new Set();
  
  if (node.culturalContext) {
    if (node.culturalContext.toLowerCase().includes('argot') || node.culturalContext.toLowerCase().includes('slang')) {
      categories.add('slang');
    }
    if (node.culturalContext.toLowerCase().includes('travail') || node.culturalContext.toLowerCase().includes('job')) {
      categories.add('workplace');
    }
  }
  
  // Categorize by simple parts of speech/type triggers
  if (node.type === 'word' && node.gender) {
    categories.add('nouns');
  }
  
  return Array.from(categories);
}

/**
 * Find all immediate neighbor nodes for a given concept ID
 */
export function getNeighbors(
  conceptId: string,
  relationships: ConceptRelationship[]
): { neighborId: string; type: string; weight: number }[] {
  const neighbors: { neighborId: string; type: string; weight: number }[] = [];

  for (const rel of relationships) {
    if (rel.sourceId === conceptId) {
      neighbors.push({ neighborId: rel.targetId, type: rel.type, weight: rel.weight });
    } else if (rel.targetId === conceptId) {
      neighbors.push({ neighborId: rel.sourceId, type: rel.type, weight: rel.weight });
    }
  }

  // Sort neighbors by edge weight descending (strongest links first)
  return neighbors.sort((a, b) => b.weight - a.weight);
}

/**
 * Find morphologically derived siblings of a concept
 */
export function getDerivedConcepts(
  conceptId: string,
  relationships: ConceptRelationship[]
): string[] {
  return relationships
    .filter(
      (rel) =>
        rel.type === 'derived' &&
        (rel.sourceId === conceptId || rel.targetId === conceptId)
    )
    .map((rel) => (rel.sourceId === conceptId ? rel.targetId : rel.sourceId));
}
