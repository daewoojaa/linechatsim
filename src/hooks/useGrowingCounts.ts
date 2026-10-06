"use client";

import { useEffect, useState } from "react";

export type Counts = { likes: number; comments: number; shares: number };

const START_DELAY_MS = 4000;
const FIRST_LIKES = 15;
const FIRST_LIKES_SPAN_MS = 5000;

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** Gaps between the first likes: uneven, with a few stalls, summing to the span. */
function firstLikeGaps(): number[] {
  const weights = Array.from({ length: FIRST_LIKES }, () => (Math.random() < 0.22 ? rand(2.5, 4.5) : rand(0.3, 1.1)));
  const total = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => (w / total) * FIRST_LIKES_SPAN_MS);
}

/**
 * Counters of a freshly shared post: nothing for 4 seconds, then likes climb
 * 1..15 over about 5 seconds in fits and starts; after that likes, comments and
 * shares keep growing one after another in a random order. Mount the caller
 * with a fresh `key` to restart it.
 */
export function useGrowingCounts(): Counts {
  const [counts, setCounts] = useState<Counts>({ likes: 0, comments: 0, shares: 0 });

  useEffect(() => {
    let timer: number | undefined;
    let stopped = false;
    const c: Counts = { likes: 0, comments: 0, shares: 0 };
    const publish = () => setCounts({ ...c });

    const later = (ms: number, fn: () => void) => {
      timer = window.setTimeout(() => {
        if (!stopped) fn();
      }, ms);
    };

    const keepGrowing = () => {
      const roll = Math.random();
      if (roll < 0.34 && c.comments < c.likes * 0.4) c.comments += 1;
      else if (roll < 0.6 && c.shares < c.likes * 0.3) c.shares += 1;
      else c.likes += Math.random() < 0.3 ? 2 : 1;
      publish();
      later(rand(450, 1500), keepGrowing);
    };

    const gaps = firstLikeGaps();
    const firstLike = (i: number) => {
      c.likes += 1;
      publish();
      if (i + 1 < gaps.length) later(gaps[i + 1], () => firstLike(i + 1));
      else later(rand(500, 1000), keepGrowing);
    };
    later(START_DELAY_MS, () => firstLike(0));

    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, []);

  return counts;
}
