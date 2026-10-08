"use client";

import { useEffect, useRef, useState } from "react";

export type Counts = { likes: number; comments: number; shares: number };

const START_DELAY_MS = 4000;
const FIRST_LIKES = 15;
const FIRST_LIKES_SPAN_MS = 5000;

/** How much faster the counters run at speed level 0 / 1 / 2 / 3 (the top heart tapped 0 / 1 / 2 / 3 times). */
const SPEEDS = [1, 3, 8, 25];
/** A new level only starts to take effect after this long, then the pace eases into it. */
const SPEED_DELAY_MS = 3000;
const SPEED_EASING = 0.3;

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
 * with a fresh `key` to restart it. `level` (0-3) speeds the counters up:
 * three seconds after it changes the pace starts easing towards the new speed.
 */
export function useGrowingCounts(level = 0): Counts {
  const [counts, setCounts] = useState<Counts>({ likes: 0, comments: 0, shares: 0 });
  const targetSpeed = useRef(SPEEDS[0]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      targetSpeed.current = SPEEDS[level] ?? SPEEDS[0];
    }, level === 0 ? 0 : SPEED_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [level]);

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

    // The pace eases towards the target a little on every step.
    let speed = SPEEDS[0];
    const nextSpeed = () => {
      speed += (targetSpeed.current - speed) * SPEED_EASING;
      return speed;
    };

    const keepGrowing = () => {
      const m = nextSpeed();
      const small = Math.max(1, Math.round(m / 3));
      const roll = Math.random();
      if (roll < 0.34 && c.comments < c.likes * 0.4) c.comments += small;
      else if (roll < 0.6 && c.shares < c.likes * 0.3) c.shares += small;
      else c.likes += Math.max(1, Math.round(m * rand(0.6, 1.4)));
      publish();
      later(rand(450, 1500) / m, keepGrowing);
    };

    const gaps = firstLikeGaps();
    const firstLike = (i: number) => {
      c.likes += 1;
      publish();
      if (i + 1 < gaps.length) later(gaps[i + 1] / nextSpeed(), () => firstLike(i + 1));
      else later(rand(500, 1000) / nextSpeed(), keepGrowing);
    };
    later(START_DELAY_MS, () => firstLike(0));

    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, []);

  return counts;
}
