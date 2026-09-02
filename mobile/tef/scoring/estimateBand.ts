// SayBon — TEF Band Estimation
// Implements planning/TEF_MODE_DESIGN.md §6.2. Our items are not
// psychometrically calibrated and never will be — this estimate must reflect
// that honestly (see §6.3's display contract: always show item count and
// confidence, never a bare number).

import { getRecentResponsesForModule } from '../data/tefDb';
import { MIN_NCLC, MAX_NCLC, isNclcScaleVerified } from '../data/nclcScale';
import type { TefModule } from '../data/itemSchema';

export type BandConfidence = 'low' | 'medium' | 'high';

export interface BandEstimate {
  estimatedBand: number | null; // null if not enough data to say anything
  confidence: BandConfidence;
  totalAnswered: number;
  scaleVerified: boolean;
  perBandAccuracy: Record<number, { accuracy: number; n: number }>;
}

const ROLLING_WINDOW = 40;
const MIN_ITEMS_PER_BAND = 12;
const ACCURACY_THRESHOLD = 0.7;

/**
 * For each NCLC band, rolling accuracy over the most recent
 * ROLLING_WINDOW answered items at that band. estimatedBand is the highest
 * band clearing both the accuracy and sample-size thresholds — i.e. "the
 * hardest level you're reliably succeeding at", not "the hardest level
 * you've ever gotten one question right on".
 */
export async function estimateBand(module: TefModule): Promise<BandEstimate> {
  const responses = await getRecentResponsesForModule(module, 1000);

  const perBand: Record<number, { correct: boolean; answeredAt: number }[]> = {};
  for (const r of responses) {
    if (!perBand[r.targetBand]) perBand[r.targetBand] = [];
    perBand[r.targetBand].push({ correct: r.correct, answeredAt: r.answeredAt });
  }

  const perBandAccuracy: Record<number, { accuracy: number; n: number }> = {};
  let estimatedBand: number | null = null;

  for (let band = MIN_NCLC; band <= MAX_NCLC; band++) {
    const bandResponses = (perBand[band] || [])
      .sort((a, b) => b.answeredAt - a.answeredAt)
      .slice(0, ROLLING_WINDOW);
    const n = bandResponses.length;
    const accuracy = n > 0 ? bandResponses.filter((r) => r.correct).length / n : 0;
    perBandAccuracy[band] = { accuracy, n };

    if (n >= MIN_ITEMS_PER_BAND && accuracy >= ACCURACY_THRESHOLD) {
      // Keep scanning upward — we want the highest band that clears the bar.
      estimatedBand = band;
    }
  }

  const totalAnswered = responses.length;
  const confidence: BandConfidence =
    totalAnswered > 400 ? 'high' : totalAnswered >= 150 ? 'medium' : 'low';

  return {
    estimatedBand,
    confidence,
    totalAnswered,
    scaleVerified: isNclcScaleVerified(),
    perBandAccuracy,
  };
}
