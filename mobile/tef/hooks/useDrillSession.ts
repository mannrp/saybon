// SayBon — TEF Drill Session
// Implements the selection algorithm from planning/TEF_MODE_DESIGN.md §5.1
// and the interaction model from §5.2 (untimed by default, elapsed time
// recorded not displayed as pressure, deliberate advance — no auto-advance).
//
// Deliberately NOT masteryEngine (core/mastery) — that models per-word
// familiarity for the L'Atelier concept grid; this models per-skill
// discrimination against exam bands. Different problem, kept separate.

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import {
  getTefItemsInBandRange,
  getResponseHistoryWithSkillTags,
  getTefStimulus,
  recordTefResponse,
} from '../data/tefDb';
import { estimateBand } from '../scoring/estimateBand';
import type { TefItem, TefModule, TefStimulus } from '../data/itemSchema';
import { MAX_NCLC, MIN_NCLC } from '../data/nclcScale';

const RECENCY_SUPPRESS_DAYS = 14;
const DEFAULT_STARTING_BAND = 5; // used only when there is no response history yet

function generateLocalId(): string {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

interface ItemHistoryEntry {
  lastCorrect: boolean;
  lastAnsweredAt: number;
}

/**
 * Weighted sample without replacement, per §5.1's weighting rules. Mutates
 * nothing outside its own scope; pure function of (pool, history, count).
 */
function selectDrillItems(
  pool: TefItem[],
  history: Map<string, ItemHistoryEntry>,
  weakestTag: string | null,
  count: number
): TefItem[] {
  const now = Date.now();
  const recencyMs = RECENCY_SUPPRESS_DAYS * 24 * 60 * 60 * 1000;

  const candidates = pool.map((item) => {
    let w = 1.0;
    if (weakestTag && item.skillTags.includes(weakestTag)) w *= 2.5;

    const hist = history.get(item.id);
    if (hist) {
      if (!hist.lastCorrect) {
        w *= 2.0; // previously missed — due for review
      } else if (now - hist.lastAnsweredAt < recencyMs) {
        w *= 0.15; // answered correctly recently — suppress, not exclude
      }
    }
    return { item, weight: w };
  });

  const picked: TefItem[] = [];
  const remaining = candidates.slice();

  while (picked.length < count && remaining.length > 0) {
    const totalWeight = remaining.reduce((sum, c) => sum + c.weight, 0);
    if (totalWeight <= 0) break;
    let r = Math.random() * totalWeight;
    let idx = 0;
    for (; idx < remaining.length; idx++) {
      r -= remaining[idx].weight;
      if (r <= 0) break;
    }
    const chosenIdx = Math.min(idx, remaining.length - 1);
    picked.push(remaining[chosenIdx].item);
    remaining.splice(chosenIdx, 1);
  }

  // Cluster items sharing a stimulusId adjacently (stable sort) so a passage
  // is read once, without changing which items were selected.
  const stimulusOrder = new Map<string, number>();
  let orderCounter = 0;
  for (const item of picked) {
    const key = item.stimulusId ?? item.id;
    if (!stimulusOrder.has(key)) stimulusOrder.set(key, orderCounter++);
  }
  return picked
    .map((item, i) => ({ item, i }))
    .sort((a, b) => {
      const ka = a.item.stimulusId ?? a.item.id;
      const kb = b.item.stimulusId ?? b.item.id;
      const oa = stimulusOrder.get(ka)!;
      const ob = stimulusOrder.get(kb)!;
      return oa !== ob ? oa - ob : a.i - b.i;
    })
    .map(({ item }) => item);
}

type Status = 'loading' | 'ready' | 'complete' | 'error';

interface AnsweredRecord {
  itemId: string;
  correct: boolean;
  chosenOptionId: string | null;
  elapsedMs: number;
  skillTags: string[];
}

interface State {
  status: Status;
  items: TefItem[];
  currentIndex: number;
  selectedOptionId: string | null;
  isLocked: boolean;
  answered: AnsweredRecord[];
  error: string | null;
}

type Action =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; items: TefItem[] }
  | { type: 'LOAD_ERROR'; message: string }
  | { type: 'SELECT_OPTION'; optionId: string }
  | { type: 'LOCK_ANSWER'; record: AnsweredRecord }
  | { type: 'NEXT' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, status: 'loading', error: null };
    case 'LOAD_SUCCESS':
      return {
        ...state,
        status: 'ready',
        items: action.items,
        currentIndex: 0,
        selectedOptionId: null,
        isLocked: false,
        answered: [],
      };
    case 'LOAD_ERROR':
      return { ...state, status: 'error', error: action.message };
    case 'SELECT_OPTION':
      if (state.isLocked) return state;
      return { ...state, selectedOptionId: action.optionId };
    case 'LOCK_ANSWER':
      if (state.isLocked) return state;
      return { ...state, isLocked: true, answered: [...state.answered, action.record] };
    case 'NEXT': {
      const nextIndex = state.currentIndex + 1;
      if (nextIndex >= state.items.length) {
        return { ...state, status: 'complete' };
      }
      return { ...state, currentIndex: nextIndex, selectedOptionId: null, isLocked: false };
    }
    default:
      return state;
  }
}

export interface DrillSummary {
  totalItems: number;
  correctCount: number;
  accuracy: number;
  medianResponseMs: number;
  perSkillTag: Record<string, { correct: number; total: number }>;
  weakestTag: { tag: string; accuracy: number } | null;
}

export interface UseDrillSessionOptions {
  module: TefModule;
  count?: number;
}

export function useDrillSession({ module, count = 10 }: UseDrillSessionOptions) {
  const [state, dispatch] = useReducer(reducer, {
    status: 'loading',
    items: [],
    currentIndex: 0,
    selectedOptionId: null,
    isLocked: false,
    answered: [],
    error: null,
  });

  const sessionId = useRef(generateLocalId());
  const itemStartedAt = useRef<number>(Date.now());
  const stimulusCache = useRef<Map<string, TefStimulus | null>>(new Map());
  const [, forceStimulusRender] = useReducer((x: number) => x + 1, 0);

  const loadSession = useCallback(async () => {
    dispatch({ type: 'LOAD_START' });
    try {
      const [bandEstimate, historyRows] = await Promise.all([
        estimateBand(module),
        getResponseHistoryWithSkillTags(module),
      ]);

      const centerBand = bandEstimate.estimatedBand ?? DEFAULT_STARTING_BAND;
      const minBand = Math.max(MIN_NCLC, centerBand - 1);
      const maxBand = Math.min(MAX_NCLC, centerBand + 1);

      const pool = await getTefItemsInBandRange(module, minBand, maxBand);
      if (pool.length === 0) {
        dispatch({ type: 'LOAD_ERROR', message: 'No items available for this module yet.' });
        return;
      }

      // Most recent response per item (history rows are already DESC by time).
      const itemHistory = new Map<string, ItemHistoryEntry>();
      for (const row of historyRows) {
        if (!itemHistory.has(row.itemId)) {
          itemHistory.set(row.itemId, { lastCorrect: row.correct, lastAnsweredAt: row.answeredAt });
        }
      }

      // Weakest skill tag: lowest accuracy among tags with enough samples to
      // be meaningful. Below that sample size, no tag gets the priority boost.
      const tagStats = new Map<string, { correct: number; total: number }>();
      for (const row of historyRows) {
        for (const tag of row.skillTags) {
          const s = tagStats.get(tag) ?? { correct: 0, total: 0 };
          s.total += 1;
          if (row.correct) s.correct += 1;
          tagStats.set(tag, s);
        }
      }
      let weakestTag: string | null = null;
      let weakestAcc = Infinity;
      for (const [tag, s] of tagStats) {
        if (s.total < 4) continue;
        const acc = s.correct / s.total;
        if (acc < weakestAcc) {
          weakestAcc = acc;
          weakestTag = tag;
        }
      }

      const selected = selectDrillItems(pool, itemHistory, weakestTag, count);
      itemStartedAt.current = Date.now();
      dispatch({ type: 'LOAD_SUCCESS', items: selected });
    } catch (err) {
      console.error('Failed to load TEF drill session:', err);
      dispatch({
        type: 'LOAD_ERROR',
        message: err instanceof Error ? err.message : 'Failed to load drill session.',
      });
    }
  }, [module, count]);

  useEffect(() => {
    loadSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentItem: TefItem | null = state.items[state.currentIndex] ?? null;

  // Fetch (and cache) the stimulus for the current item, if any.
  useEffect(() => {
    if (!currentItem?.stimulusId) return;
    if (stimulusCache.current.has(currentItem.stimulusId)) return;
    let cancelled = false;
    getTefStimulus(currentItem.stimulusId).then((s) => {
      if (cancelled || !currentItem.stimulusId) return;
      stimulusCache.current.set(currentItem.stimulusId, s);
      forceStimulusRender();
    });
    return () => {
      cancelled = true;
    };
  }, [currentItem?.stimulusId]);

  const currentStimulus: TefStimulus | null = currentItem?.stimulusId
    ? stimulusCache.current.get(currentItem.stimulusId) ?? null
    : null;

  const selectOption = useCallback(
    (optionId: string) => dispatch({ type: 'SELECT_OPTION', optionId }),
    []
  );

  const lockAnswer = useCallback(() => {
    if (!currentItem || state.isLocked || !state.selectedOptionId) return;
    const correct = state.selectedOptionId === currentItem.correctOptionId;
    const elapsedMs = Date.now() - itemStartedAt.current;

    dispatch({
      type: 'LOCK_ANSWER',
      record: {
        itemId: currentItem.id,
        correct,
        chosenOptionId: state.selectedOptionId,
        elapsedMs,
        skillTags: currentItem.skillTags,
      },
    });

    recordTefResponse({
      id: generateLocalId(),
      itemId: currentItem.id,
      chosenOptionId: state.selectedOptionId,
      correct,
      elapsedMs,
      sessionId: sessionId.current,
      answeredAt: Date.now(),
    }).catch((err) => console.warn('Failed to persist TEF response:', err));
  }, [currentItem, state.isLocked, state.selectedOptionId]);

  const next = useCallback(() => {
    itemStartedAt.current = Date.now();
    dispatch({ type: 'NEXT' });
  }, []);

  const summary: DrillSummary | null = useMemo(() => {
    if (state.status !== 'complete') return null;
    const total = state.answered.length;
    const correctCount = state.answered.filter((a) => a.correct).length;
    const sortedTimes = state.answered.map((a) => a.elapsedMs).sort((a, b) => a - b);
    const medianResponseMs =
      sortedTimes.length === 0
        ? 0
        : sortedTimes.length % 2 === 1
        ? sortedTimes[(sortedTimes.length - 1) / 2]
        : (sortedTimes[sortedTimes.length / 2 - 1] + sortedTimes[sortedTimes.length / 2]) / 2;

    const perSkillTag: Record<string, { correct: number; total: number }> = {};
    for (const a of state.answered) {
      for (const tag of a.skillTags) {
        const s = perSkillTag[tag] ?? { correct: 0, total: 0 };
        s.total += 1;
        if (a.correct) s.correct += 1;
        perSkillTag[tag] = s;
      }
    }

    let weakestTag: DrillSummary['weakestTag'] = null;
    let weakestAcc = Infinity;
    for (const [tag, s] of Object.entries(perSkillTag)) {
      const acc = s.correct / s.total;
      if (s.total >= 2 && acc < weakestAcc) {
        weakestAcc = acc;
        weakestTag = { tag, accuracy: acc };
      }
    }

    return {
      totalItems: total,
      correctCount,
      accuracy: total > 0 ? correctCount / total : 0,
      medianResponseMs,
      perSkillTag,
      weakestTag,
    };
  }, [state.status, state.answered]);

  return {
    status: state.status,
    error: state.error,
    items: state.items,
    currentIndex: state.currentIndex,
    currentItem,
    currentStimulus,
    selectedOptionId: state.selectedOptionId,
    isLocked: state.isLocked,
    selectOption,
    lockAnswer,
    next,
    summary,
    retry: loadSession,
  };
}
