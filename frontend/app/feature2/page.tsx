'use client';
import React, { useEffect, useMemo, useState } from 'react';

/**
 * Diet Planner — green theme + functional progress
 * - White cards, green headings, subtle gray dividers
 * - Bars fill up to target; overflow shows as a thin red cap
 * - Per-meal macro bars + expandable micros
 * - Per-day macro summary vs daily target
 * - Same data/optimizer as before
 */

const MEALS = ['Breakfast', 'Lunch', 'Dinner'] as const;
type MealType = (typeof MEALS)[number];

export type NutrientKey =
  | 'Calories'
  | 'Protein'
  | 'Total Fat'
  | 'Tot. Carb.'
  | 'Sat. Fat'
  | 'Trans Fat'
  | 'Dietary Fiber'
  | 'Sugars'
  | 'Cholesterol'
  | 'Sodium'
  | 'Potassium'
  | 'Calcium'
  | 'Iron'
  | 'Vitamin C'
  | 'Vitamin D'
  | 'Vitamin B12';

type Unit = 'kcal' | 'g' | 'mg' | 'mcg';

export interface NutrientSpec {
  key: NutrientKey;
  label: string;
  unit: Unit;
  group: 'macro' | 'micro';
  defaultTarget: number;
  min?: number;
  max?: number;
}

export interface NutrientTargetState {
  target: number;
  weight: number;
  min?: number;
  max?: number;
}

export interface NutrientsRecord {
  [key: string]: number | undefined;
}

interface RawVenue {
  name: string;
  menu: { menus?: Array<{ name: string; description?: string; link?: string }> };
}

interface UIMenuItem {
  name: string;
  description?: string;
  link?: string;
}

interface SelectedMeal {
  venue: string;
  item: UIMenuItem;
  nutrients: NutrientsRecord;
  nutritionUrl?: string;
}

interface DayPlan {
  date: Date;
  meals: Record<MealType, SelectedMeal>;
}

const HALLS = [
  'Forbes College',
  'Mathey College',
  'Rockefeller College',
  'Whitman & Butler Colleges',
  'Yeh College & New College West',
  'Center for Jewish Life',
  'Graduate College',
];

const CATALOG: NutrientSpec[] = [
  { key: 'Calories', label: 'Calories', unit: 'kcal', group: 'macro', defaultTarget: 2000 },
  { key: 'Protein', label: 'Protein', unit: 'g', group: 'macro', defaultTarget: 120 },
  { key: 'Total Fat', label: 'Total Fat', unit: 'g', group: 'macro', defaultTarget: 70 },
  { key: 'Tot. Carb.', label: 'Total Carbs', unit: 'g', group: 'macro', defaultTarget: 250 },
  { key: 'Sat. Fat', label: 'Sat Fat', unit: 'g', group: 'micro', defaultTarget: 20, max: 20 },
  { key: 'Trans Fat', label: 'Trans Fat', unit: 'g', group: 'micro', defaultTarget: 0, max: 2 },
  { key: 'Dietary Fiber', label: 'Fiber', unit: 'g', group: 'micro', defaultTarget: 28, min: 20 },
  { key: 'Sugars', label: 'Sugars', unit: 'g', group: 'micro', defaultTarget: 40, max: 50 },
  {
    key: 'Cholesterol',
    label: 'Cholesterol',
    unit: 'mg',
    group: 'micro',
    defaultTarget: 300,
    max: 300,
  },
  { key: 'Sodium', label: 'Sodium', unit: 'mg', group: 'micro', defaultTarget: 2300, max: 2300 },
  {
    key: 'Potassium',
    label: 'Potassium',
    unit: 'mg',
    group: 'micro',
    defaultTarget: 3400,
    min: 2600,
  },
  { key: 'Calcium', label: 'Calcium', unit: 'mg', group: 'micro', defaultTarget: 1000, min: 800 },
  { key: 'Iron', label: 'Iron', unit: 'mg', group: 'micro', defaultTarget: 18, min: 12 },
  { key: 'Vitamin C', label: 'Vitamin C', unit: 'mg', group: 'micro', defaultTarget: 90, min: 75 },
  { key: 'Vitamin D', label: 'Vitamin D', unit: 'mcg', group: 'micro', defaultTarget: 20, min: 15 },
  {
    key: 'Vitamin B12',
    label: 'Vitamin B12',
    unit: 'mcg',
    group: 'micro',
    defaultTarget: 2.4,
    min: 2,
  },
];

const defaultTargets = Object.fromEntries(
  CATALOG.map((n) => [
    n.key,
    { target: n.defaultTarget, weight: n.group === 'macro' ? 1 : 0.25, min: n.min, max: n.max },
  ])
) as Record<NutrientKey, NutrientTargetState>;

function formatDateISO(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
function pct(n: number, d: number) {
  if (!d || d === 0) return 0;
  return (n / d) * 100;
}

function computePerMealTargets(
  daily: Record<NutrientKey, NutrientTargetState>,
  split: Record<MealType, number>
) {
  const perMeal: Record<MealType, Record<NutrientKey, number>> = {
    Breakfast: {} as any,
    Lunch: {} as any,
    Dinner: {} as any,
  };
  (Object.keys(daily) as NutrientKey[]).forEach((k) => {
    MEALS.forEach((m) => {
      perMeal[m][k] = (daily[k].target || 0) * (split[m] || 0);
    });
  });
  return perMeal;
}

function scoreItem(
  item: NutrientsRecord,
  perMealTargets: Record<NutrientKey, number>,
  daily: Record<NutrientKey, NutrientTargetState>,
  hallPenalty: number,
  preferredHallMatch: boolean
) {
  let score = 0;
  (Object.keys(daily) as NutrientKey[]).forEach((k) => {
    const t = perMealTargets[k] || 0;
    const w = daily[k].weight || 0;
    const v = (item[k] as number) || 0;
    if (t > 0 && w > 0) {
      const relErr = (v - t) / Math.max(1, t);
      score += w * relErr * relErr;
    }
    const min = daily[k].min,
      max = daily[k].max;
    if (max !== undefined && v > max / 3) {
      const over = v - max / 3;
      score += w * 2 * (over / Math.max(1, max / 3)) ** 2;
    }
    if (min !== undefined && v < min / 3) {
      const under = min / 3 - v;
      score += w * 1.5 * (under / Math.max(1, min / 3)) ** 2;
    }
  });
  if (!preferredHallMatch) score += hallPenalty;
  return score;
}

function improveDayGreedy(
  day: Record<MealType, SelectedMeal>,
  perMealTargets: Record<MealType, Record<NutrientKey, number>>,
  daily: Record<NutrientKey, NutrientTargetState>
) {
  const mealKeys = [...MEALS];
  function dayMacroError(meals: Record<MealType, SelectedMeal>) {
    const macros: NutrientKey[] = ['Calories', 'Protein', 'Total Fat', 'Tot. Carb.'];
    const totals = Object.fromEntries(macros.map((k) => [k, 0])) as Record<NutrientKey, number>;
    mealKeys.forEach((mk) => {
      macros.forEach((k) => {
        totals[k] += (meals[mk].nutrients[k] as number) || 0;
      });
    });
    let err = 0;
    macros.forEach((k) => {
      const t = daily[k].target || 0;
      if (t > 0) {
        const rel = (totals[k] - t) / t;
        err += rel * rel;
      }
    });
    return err;
  }

  let best = structuredClone(day);
  let bestErr = dayMacroError(best);
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < mealKeys.length; i++) {
      for (let j = i + 1; j < mealKeys.length; j++) {
        const a = mealKeys[i],
          b = mealKeys[j];
        const candidate = structuredClone(best);
        [candidate[a], candidate[b]] = [candidate[b], candidate[a]];
        const e = dayMacroError(candidate);
        if (e + 1e-6 < bestErr) {
          best = candidate;
          bestErr = e;
          improved = true;
        }
      }
    }
  }
  return best;
}

export default function DietPlannerPro() {
  const [startDate, setStartDate] = useState<Date>(new Date('2025-05-13'));

  const [targets, setTargets] = useState<Record<NutrientKey, NutrientTargetState>>(() =>
    structuredClone(defaultTargets)
  );

  const presets = [
    { name: 'Balanced', apply: () => ({ Calories: 2000, Protein: 120, Fat: 70, Carbs: 250 }) },
    { name: 'Low-Carb', apply: () => ({ Calories: 1900, Protein: 140, Fat: 85, Carbs: 120 }) },
    { name: 'High-Protein', apply: () => ({ Calories: 2200, Protein: 160, Fat: 75, Carbs: 200 }) },
  ];

  const [split, setSplit] = useState<Record<MealType, number>>({
    Breakfast: 0.25,
    Lunch: 0.35,
    Dinner: 0.4,
  });

  const [preferredHall, setPreferredHall] = useState<string>('');
  const [hallPenalty, setHallPenalty] = useState<number>(0.03);
  const [allergens, setAllergens] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [plan, setPlan] = useState<DayPlan[]>([]);

  const perMealTargets = useMemo(() => computePerMealTargets(targets, split), [targets, split]);

  // -------- Fetch (same logic; placeholder data when empty) --------
  async function fetchMenu(date: Date, meal: MealType) {
    const menuId = `${formatDateISO(date)}-${meal}`;
    try {
      const res = await fetch(
        `http://localhost:8000/api/dining/menu/?location_id=5&menu_id=${menuId}`,
        { credentials: 'include' }
      );
      if (!res.ok) throw new Error('bad response');
      const js = await res.json();
      const venues: RawVenue[] = js?.locations?.location || [];

      const candidates: SelectedMeal[] = [];
      for (const rv of venues) {
        const menus = rv?.menu?.menus || [];
        for (const m of menus) {
          const nutrients: NutrientsRecord = {};
          CATALOG.forEach((n) => {
            // TODO: replace this with real nutrition values from your API
            const base = n.group === 'macro' ? 1 : 0.2;
            const mag = n.unit === 'kcal' ? 500 : n.unit === 'mg' ? 800 : 40;
            nutrients[n.key] = Math.max(0, Math.round(base * mag * Math.random()));
          });
          candidates.push({
            venue: rv.name,
            item: { name: m.name, description: m.description, link: m.link },
            nutrients,
            nutritionUrl: m.link,
          });
        }
      }

      if (candidates.length === 0) {
        const nutrients: NutrientsRecord = {};
        CATALOG.forEach((n) => (nutrients[n.key] = (targets[n.key].target || 0) / 3));
        return [
          {
            venue: 'Unavailable',
            item: { name: `Placeholder ${meal}`, description: 'No menu data', link: '#' },
            nutrients,
            nutritionUrl: '#',
          },
        ] as SelectedMeal[];
      }

      // placeholder for allergen filtering
      return candidates.filter(() => true);
    } catch {
      const nutrients: NutrientsRecord = {};
      CATALOG.forEach((n) => (nutrients[n.key] = (targets[n.key].target || 0) / 3));
      return [
        {
          venue: 'Unavailable',
          item: { name: `Placeholder ${meal}`, description: 'Fetch error', link: '#' },
          nutrients,
          nutritionUrl: '#',
        },
      ] as SelectedMeal[];
    }
  }

  async function generatePlan() {
    setLoading(true);
    setError('');
    try {
      const week: DayPlan[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);

        const dayMeals: Partial<Record<MealType, SelectedMeal>> = {};
        for (const meal of MEALS) {
          const candidates = await fetchMenu(date, meal);
          let best = candidates[0];
          let bestScore = Number.POSITIVE_INFINITY;
          for (const c of candidates) {
            const score = scoreItem(
              c.nutrients,
              perMealTargets[meal],
              targets,
              hallPenalty,
              preferredHall ? c.venue === preferredHall : true
            );
            if (score < bestScore) {
              best = c;
              bestScore = score;
            }
          }
          dayMeals[meal] = best;
        }
        const improved = improveDayGreedy(
          dayMeals as Record<MealType, SelectedMeal>,
          perMealTargets,
          targets
        );
        week.push({ date, meals: improved });
      }
      setPlan(week);
    } catch {
      setError('Failed to generate plan. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const macroKeys: NutrientKey[] = ['Calories', 'Protein', 'Total Fat', 'Tot. Carb.'];
  const microKeys = CATALOG.filter((n) => n.group === 'micro').map((n) => n.key as NutrientKey);

  // ---------- UI atoms ----------
  function TargetRow({ k }: { k: NutrientKey }) {
    const spec = CATALOG.find((n) => n.key === k)!;
    const s = targets[k];
    return (
      <div className='grid grid-cols-12 gap-2 items-center py-2 border-b border-neutral-200'>
        <div className='col-span-3 font-medium text-sm text-green-700'>
          {spec.label} <span className='text-xs text-neutral-500'>({spec.unit})</span>
        </div>
        <div className='col-span-3'>
          <input
            type='number'
            className='w-full rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-400'
            value={s.target}
            min={0}
            onChange={(e) =>
              setTargets((t) => ({ ...t, [k]: { ...t[k], target: Number(e.target.value) } }))
            }
          />
        </div>
        <div className='col-span-3 flex items-center gap-2'>
          <span className='text-xs text-neutral-500 w-10'>wt</span>
          <input
            type='range'
            min={0}
            max={100}
            value={Math.round((s.weight || 0) * 100)}
            onChange={(e) =>
              setTargets((t) => ({ ...t, [k]: { ...t[k], weight: Number(e.target.value) / 100 } }))
            }
            className='w-full accent-green-700'
          />
          <span className='text-xs w-8 text-right'>{Math.round((s.weight || 0) * 100)}</span>
        </div>
        <div className='col-span-3 flex items-center gap-2'>
          <input
            placeholder='min'
            type='number'
            className='w-1/2 rounded-md border px-2 py-1 text-sm focus:ring-2 focus:ring-green-400'
            value={s.min ?? ''}
            onChange={(e) =>
              setTargets((t) => ({
                ...t,
                [k]: { ...t[k], min: e.target.value === '' ? undefined : Number(e.target.value) },
              }))
            }
          />
          <input
            placeholder='max'
            type='number'
            className='w-1/2 rounded-md border px-2 py-1 text-sm focus:ring-2 focus:ring-green-400'
            value={s.max ?? ''}
            onChange={(e) =>
              setTargets((t) => ({
                ...t,
                [k]: { ...t[k], max: e.target.value === '' ? undefined : Number(e.target.value) },
              }))
            }
          />
        </div>
      </div>
    );
  }

  function NutrientBar({
    value,
    target,
    ariaLabel,
  }: {
    value: number;
    target: number;
    ariaLabel: string;
  }) {
    // Fill up to 100% for target; overflow shows as red cap
    const p = pct(value, target);
    const fill = clamp(p, 0, 100);
    const overflow = Math.max(0, p - 100);

    return (
      <div
        className='relative h-2 w-full rounded-md bg-green-50 ring-1 ring-inset ring-green-100'
        aria-label={ariaLabel}
      >
        {/* fill to target */}
        <div
          className='h-2 rounded-md bg-gradient-to-r from-green-500 to-green-700'
          style={{ width: `${fill}%` }}
        />
        {/* overflow cap */}
        {overflow > 0 && (
          <div
            className='absolute right-0 top-0 h-2 rounded-r-md bg-red-500/70'
            style={{ width: `${Math.min(overflow, 50)}%` }}
            title='Over target'
          />
        )}
        {/* target tick at 100% */}
        <div className='absolute left-[100%] top-0 h-2 w-[2px] -translate-x-1/2 bg-green-800/70' />
      </div>
    );
  }

  function NutrientPill({
    label,
    value,
    target,
    unit,
  }: {
    label: string;
    value: number;
    target: number;
    unit: string;
  }) {
    const p = target > 0 ? (value / target) * 100 : 0;
    const status = p < 80 ? 'text-amber-600' : p <= 110 ? 'text-green-700' : 'text-red-600';

    return (
      <div className='flex items-center gap-3'>
        <div className='w-20 text-xs font-medium text-green-700'>{label}</div>
        <div className='flex-1'>
          <NutrientBar value={value} target={target} ariaLabel={`${label} progress`} />
        </div>
        <div className={`w-28 text-right text-xs tabular-nums ${status}`}>
          {Math.round(value)} {unit} <span className='text-neutral-400'>·</span> {Math.round(p)}%
        </div>
      </div>
    );
  }

  // ---------- Render ----------
  return (
    <div className='mx-auto max-w-6xl p-6'>
      {/* Header */}
      <div className='mb-6 flex flex-wrap items-center justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-semibold text-green-800'>Diet Planner</h1>
          <p className='text-sm text-neutral-600'>Plan by macros & micros with per-meal targets.</p>
        </div>
        <div className='flex items-center gap-3'>
          <input
            type='date'
            className='rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400'
            value={formatDateISO(startDate)}
            onChange={(e) => setStartDate(new Date(e.target.value))}
            aria-label='Start date'
          />
          <button
            className='rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-60'
            onClick={generatePlan}
            disabled={loading}
          >
            {loading ? 'Generating…' : 'Generate Weekly Plan'}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
        {/* Left: Targets */}
        <div className='md:col-span-2 rounded-2xl border bg-white p-4 shadow-sm'>
          <div className='mb-3 flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-green-800'>Daily Targets</h2>
            <div className='flex flex-wrap items-center gap-2'>
              {presets.map((p) => (
                <button
                  key={p.name}
                  className='rounded-full border border-green-200 px-3 py-1 text-xs text-green-700 hover:bg-green-50'
                  onClick={() => {
                    const cfg = p.apply();
                    setTargets((t) => ({
                      ...t,
                      Calories: { ...t.Calories, target: cfg.Calories ?? t.Calories.target },
                      Protein: { ...t.Protein, target: cfg.Protein ?? t.Protein.target },
                      ['Total Fat']: {
                        ...t['Total Fat'],
                        target: (cfg as any).Fat ?? t['Total Fat'].target,
                      },
                      ['Tot. Carb.']: {
                        ...t['Tot. Carb.'],
                        target: (cfg as any).Carbs ?? t['Tot. Carb.'].target,
                      },
                    }));
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Macro rows */}
          <div className='rounded-xl border bg-white'>
            <div className='px-3 py-2 text-sm font-medium text-green-700'>Macros</div>
            {(['Calories', 'Protein', 'Total Fat', 'Tot. Carb.'] as NutrientKey[]).map((k) => (
              <TargetRow key={k} k={k} />
            ))}
          </div>

          {/* Micro rows */}
          <div className='mt-4 rounded-xl border bg-white'>
            <div className='px-3 py-2 text-sm font-medium text-green-700'>Micronutrients</div>
            {CATALOG.filter((n) => n.group === 'micro').map((n) => (
              <TargetRow key={n.key} k={n.key as NutrientKey} />
            ))}
          </div>
        </div>

        {/* Right: Plan options */}
        <div className='rounded-2xl border bg-white p-4 shadow-sm'>
          <h3 className='mb-3 text-lg font-semibold text-green-800'>Plan Options</h3>
          <div className='space-y-5'>
            <div>
              <div className='mb-1 text-sm font-medium text-green-700'>Per-meal Split</div>
              {MEALS.map((m) => (
                <div key={m} className='mb-2 flex items-center gap-2'>
                  <div className='w-24 text-xs text-neutral-600'>{m}</div>
                  <input
                    type='range'
                    min={0}
                    max={100}
                    value={Math.round(split[m] * 100)}
                    onChange={(e) => {
                      const val = Number(e.target.value) / 100;
                      const rest = 1 - val;
                      const others = MEALS.filter((x) => x !== m);
                      const even = rest / 2;
                      setSplit({ [m]: val, [others[0]]: even, [others[1]]: even } as any);
                    }}
                    className='flex-1 accent-green-700'
                  />
                  <div className='w-10 text-right text-xs tabular-nums'>
                    {Math.round(split[m] * 100)}%
                  </div>
                </div>
              ))}
              <div className='text-xs text-neutral-500'>
                Sliders rebalance to ~100% automatically.
              </div>
            </div>

            <div className='h-px w-full bg-neutral-200' />

            <div>
              <div className='mb-1 text-sm font-medium text-green-700'>Preferred Hall</div>
              <select
                className='w-full rounded-md border px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400'
                value={preferredHall}
                onChange={(e) => setPreferredHall(e.target.value)}
              >
                <option value=''>Any</option>
                {HALLS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              <div className='mt-2 flex items-center gap-2'>
                <span className='text-xs text-neutral-600'>Hall Penalty</span>
                <input
                  type='range'
                  min={0}
                  max={100}
                  value={Math.round(hallPenalty * 100)}
                  onChange={(e) => setHallPenalty(Number(e.target.value) / 100)}
                  className='flex-1 accent-green-700'
                />
                <span className='w-8 text-right text-xs'>{Math.round(hallPenalty * 100)}</span>
              </div>
            </div>

            <div className='h-px w-full bg-neutral-200' />

            <div>
              <div className='mb-1 text-sm font-medium text-green-700'>Allergens</div>
              <input
                className='w-full rounded-md border px-2 py-2 text-sm focus:ring-2 focus:ring-green-400'
                placeholder='e.g., peanuts, gluten (placeholder — requires API tags)'
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const v = (e.target as HTMLInputElement).value.trim();
                    if (v) setAllergens((a) => [...a, v.toLowerCase()]);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
              {allergens.length > 0 && (
                <div className='mt-2 flex flex-wrap gap-2'>
                  {allergens.map((a) => (
                    <span
                      key={a}
                      className='rounded-full border border-green-200 bg-green-50 px-2 py-1 text-xs text-green-700'
                    >
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className='mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700'>
          {error}
        </div>
      )}

      {/* Plan grid */}
      <div className='mt-8 grid grid-cols-1 gap-6 md:grid-cols-2'>
        {plan.map((day) => {
          // compute day macro totals for the summary card
          const dayTotals: Record<NutrientKey, number> = {
            Calories: 0,
            Protein: 0,
            'Total Fat': 0,
            'Tot. Carb.': 0,
            'Sat. Fat': 0,
            'Trans Fat': 0,
            'Dietary Fiber': 0,
            Sugars: 0,
            Cholesterol: 0,
            Sodium: 0,
            Potassium: 0,
            Calcium: 0,
            Iron: 0,
            'Vitamin C': 0,
            'Vitamin D': 0,
            'Vitamin B12': 0,
          };
          (Object.keys(day.meals) as MealType[]).forEach((mk) => {
            const n = day.meals[mk].nutrients;
            ['Calories', 'Protein', 'Total Fat', 'Tot. Carb.'].forEach((k) => {
              dayTotals[k as NutrientKey] += Number(n[k] || 0);
            });
          });

          return (
            <div key={day.date.toISOString()} className='rounded-2xl border bg-white p-4 shadow-sm'>
              <div className='mb-4 flex items-baseline justify-between'>
                <div>
                  <div className='text-sm text-neutral-500'>
                    {day.date.toLocaleDateString('en-US', { weekday: 'long' })}
                  </div>
                  <div className='text-lg font-semibold text-green-800'>
                    {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Daily macro summary vs daily targets */}
              <div className='mb-4 rounded-xl border border-green-200 bg-green-50 p-3'>
                <div className='mb-2 text-xs font-semibold uppercase tracking-wide text-green-800'>
                  Daily Macro Summary
                </div>
                <div className='space-y-2'>
                  {(['Calories', 'Protein', 'Total Fat', 'Tot. Carb.'] as NutrientKey[]).map(
                    (k) => (
                      <div key={k} className='flex items-center gap-3'>
                        <div className='w-20 text-xs text-green-800'>
                          {k === 'Tot. Carb.' ? 'Carbs' : k}
                        </div>
                        <div className='flex-1'>
                          <NutrientBar
                            value={dayTotals[k]}
                            target={targets[k].target}
                            ariaLabel={`${k} daily progress`}
                          />
                        </div>
                        <div className='w-28 text-right text-xs tabular-nums'>
                          {Math.round(dayTotals[k])} {CATALOG.find((c) => c.key === k)!.unit}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Meals */}
              <div className='grid grid-cols-1 gap-4'>
                {MEALS.map((m) => {
                  const sel = day.meals[m];
                  return (
                    <div key={m} className='rounded-xl border p-3'>
                      <div className='mb-1 flex items-center justify-between'>
                        <div className='font-medium text-green-800'>{m}</div>
                        <div className='text-xs text-neutral-500'>{sel.venue}</div>
                      </div>
                      <div className='mb-2 text-sm'>
                        {sel.item.link ? (
                          <a
                            className='text-green-700 underline underline-offset-2 hover:text-green-800'
                            href={`/feature4?url=${encodeURIComponent(sel.item.link)}`}
                            target='_blank'
                            rel='noreferrer'
                          >
                            {sel.item.name}
                          </a>
                        ) : (
                          <span className='text-neutral-800'>{sel.item.name}</span>
                        )}
                      </div>

                      {/* Per-meal macro bars vs per-meal targets */}
                      <div className='mb-3 space-y-2'>
                        {(['Calories', 'Protein', 'Total Fat', 'Tot. Carb.'] as NutrientKey[]).map(
                          (k) => (
                            <NutrientPill
                              key={k}
                              label={k === 'Tot. Carb.' ? 'Carbs' : k}
                              value={Number(sel.nutrients[k] || 0)}
                              target={perMealTargets[m][k] || 0}
                              unit={CATALOG.find((c) => c.key === k)!.unit}
                            />
                          )
                        )}
                      </div>

                      {/* Expandable micronutrients summary */}
                      <details className='group'>
                        <summary className='cursor-pointer select-none text-xs text-neutral-600 group-open:mb-2'>
                          Micronutrients
                        </summary>
                        <div className='grid grid-cols-2 gap-x-4 gap-y-1 text-xs'>
                          {microKeys.map((k) => (
                            <div key={k} className='flex justify-between'>
                              <span className='text-neutral-600'>
                                {CATALOG.find((c) => c.key === k)!.label}
                              </span>
                              <span className='tabular-nums'>
                                {Math.round(Number(sel.nutrients[k] || 0))}{' '}
                                {CATALOG.find((c) => c.key === k)!.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
