'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Tooltip } from 'evergreen-ui';
import { ALLERGEN_ICON_MAP } from '@/lib/constants';
import { calculateDVPercentage, detectAllergens, formatAmount } from '@/lib/utils';
import type { Allergen, MenuItemNutrition } from '@/types';

// FDA daily values for a 2,000 calorie diet, in the unit shown for each nutrient.
const DAILY_VALUES = {
  sodium: 2300,
  totalFat: 78,
  saturatedFat: 20,
  transFat: 2,
  protein: 50,
  totalCarbs: 275,
  dietaryFiber: 28,
  totalSugars: 50,
  cholesterol: 300,
  vitaminD: 20,
  calcium: 1300,
  iron: 18,
  potassium: 4700,
} as const;
type NutrientKey = keyof typeof DAILY_VALUES;

// Whether a high daily-value percentage is something to limit or something beneficial.
const NUTRIENT_KIND: Record<NutrientKey, 'limit' | 'good' | 'neutral'> = {
  sodium: 'limit',
  totalFat: 'limit',
  saturatedFat: 'limit',
  transFat: 'limit',
  totalSugars: 'limit',
  cholesterol: 'limit',
  protein: 'good',
  dietaryFiber: 'good',
  vitaminD: 'good',
  calcium: 'good',
  iron: 'good',
  potassium: 'good',
  totalCarbs: 'neutral',
};

/**
 * Campus Dining publishes some labels with no calories and zero for everything else, meaning the
 * recipe has not been analysed. Those are shown as unavailable rather than as a list of zeroes.
 */
export function hasNutritionValues(nutrition: MenuItemNutrition): boolean {
  if (nutrition.calories != null) return true;
  return (Object.keys(DAILY_VALUES) as NutrientKey[]).some((key) => (nutrition[key] ?? 0) > 0);
}

function rdvColor(nutrient: NutrientKey, percent: number): string {
  const kind = NUTRIENT_KIND[nutrient];
  if (kind === 'limit') {
    if (percent < 15) return '#8BCF95';
    if (percent <= 40) return '#F6C77D';
    return '#FF8989';
  }
  return kind === 'good' ? '#8BCF95' : '#C9C9C9E5';
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <span className='text-[11px] leading-3 font-semibold text-[#898787]'>{children}</span>;
}

function MetricValue({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`text-[14px] leading-3 font-semibold text-[#454545] ${className}`}>
      {children}
    </span>
  );
}

function ServingCalories({
  servingSize,
  calories,
}: {
  servingSize: string | null | undefined;
  calories: number | null | undefined;
}) {
  return (
    <div className='-mt-2 -ml-[9px] flex flex-row items-center justify-between rounded-[5px] bg-gradient-to-b from-white to-[#E9E9E9] p-3 pt-[7px] pb-[9px]'>
      <div className='flex shrink-0 flex-col gap-1'>
        <SectionTitle>Serving Size</SectionTitle>
        <MetricValue>{servingSize || '-'}</MetricValue>
      </div>
      <div className='mx-2 w-[1.5px] self-stretch rounded-full bg-[#b6b6b6]' />
      <div className='flex shrink-0 flex-col gap-1'>
        <SectionTitle>Calories</SectionTitle>
        <MetricValue className='text-right'>{formatAmount(calories, 0)}</MetricValue>
      </div>
    </div>
  );
}

function Nutrient({
  nutrient,
  label,
  unit,
  amount,
  className = '',
}: {
  nutrient: NutrientKey;
  label: string;
  unit: string;
  amount: number | null | undefined;
  className?: string;
}) {
  const percent = calculateDVPercentage(amount, DAILY_VALUES[nutrient]);
  // Labels print milligrams as whole numbers and grams to a tenth; finer digits are noise.
  const shown = amount != null ? `${formatAmount(amount, unit === 'mg' ? 0 : 1)} ${unit}` : '-';
  return (
    <div className={`flex flex-col gap-[2px] ${className}`} data-nutrient={nutrient}>
      <SectionTitle>{label}</SectionTitle>
      <div className='flex flex-col items-baseline gap-2'>
        <MetricValue>{shown}</MetricValue>
        {percent != null && (
          <div className='text-[10px] leading-3 text-[#6A6868]'>
            <span>{percent}%</span>
            <span
              className='mx-1 inline-block h-[2px] w-[15px] rounded align-middle'
              style={{ backgroundColor: rdvColor(nutrient, percent) }}
            />
            <span>DV</span>
          </div>
        )}
      </div>
    </div>
  );
}

/** Horizontally scrolling allergen icons, with a fade hint when there is more to scroll. */
function AllergenIcons({ allergens }: { allergens: Allergen[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollable, setScrollable] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => setScrollable(el.scrollWidth > el.clientWidth);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [allergens]);

  return (
    <div className='flex flex-col gap-1'>
      <SectionTitle>Allergens</SectionTitle>
      {allergens.length === 0 ? (
        <span className='text-xs text-gray-400'>-</span>
      ) : (
        <div className='relative'>
          <div
            ref={scrollRef}
            className='no-scrollbar flex items-center gap-1 overflow-x-auto pr-4'
          >
            {allergens.map((allergen) => (
              <Tooltip
                key={allergen}
                content={allergen}
                appearance='card'
                statelessProps={{ paddingX: 6, paddingY: 2, fontSize: 9 }}
              >
                <img
                  src={ALLERGEN_ICON_MAP[allergen]}
                  alt={allergen}
                  width={18}
                  height={18}
                  className='inline-block flex-shrink-0'
                />
              </Tooltip>
            ))}
          </div>
          {scrollable && (
            <div className='pointer-events-none absolute -top-1 right-0 bottom-0 w-4 rounded-r bg-gradient-to-l from-[#e4e4e4] to-transparent py-3' />
          )}
        </div>
      )}
    </div>
  );
}

const SMALL_TEXT = 'text-[11px] leading-snug font-light text-[#6b6b6b]';

function TextBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className='flex flex-col gap-1'>
      <SectionTitle>{title}</SectionTitle>
      <p className={SMALL_TEXT}>{text}</p>
    </div>
  );
}

/** The ingredient list is long, so it stays folded until asked for. */
function Ingredients({ text }: { text: string }) {
  return (
    <details className='group'>
      <summary className='flex cursor-pointer list-none items-center gap-1 select-none [&::-webkit-details-marker]:hidden'>
        <SectionTitle>Ingredients</SectionTitle>
        <span className='text-[11px] leading-3 text-[#898787] transition-transform group-open:rotate-90'>
          ›
        </span>
      </summary>
      <p className={`mt-1 ${SMALL_TEXT}`}>{text}</p>
    </details>
  );
}

// A group of three nutrients drawn on a raised panel.
function NutrientGroup({ children }: { children: ReactNode }) {
  return (
    <div
      className='col-span-3 -ml-[9px] p-[2px]'
      style={{ borderRadius: 7, background: 'linear-gradient(0deg, #F7F7F7, #E5E5E5)' }}
    >
      <div className='flex gap-2 bg-[#F7F7F7] pt-[5px] pl-[8px]' style={{ borderRadius: 5 }}>
        {children}
      </div>
    </div>
  );
}

const Divider = () => <div className='my-2 h-[2px] w-full rounded bg-[#E9E9E9]' />;

function IngredientsAndAllergens({ nutrition }: { nutrition: MenuItemNutrition }) {
  const { ingredients, allergens } = nutrition;
  return (
    <>
      {ingredients && <Ingredients text={ingredients} />}
      {allergens && (
        <div className={ingredients ? 'mt-2' : ''}>
          <TextBlock title='Allergens' text={allergens} />
        </div>
      )}
    </>
  );
}

/** Full nutrition label for a menu item, shown inside the row's accordion. */
export default function NutritionFacts({
  nutrition,
}: {
  nutrition: MenuItemNutrition | null | undefined;
}) {
  if (!nutrition) {
    return <div className='p-4 text-gray-500'>No nutrition information available</div>;
  }

  if (!hasNutritionValues(nutrition)) {
    return (
      <div className='px-4 pt-2 pb-3'>
        <p className='mb-2 text-xs text-gray-500'>
          Campus Dining has not published nutrition facts for this item.
        </p>
        <IngredientsAndAllergens nutrition={nutrition} />
      </div>
    );
  }

  return (
    <div
      className='px-4 pt-2 pb-3'
      style={{
        borderRadius: '0 0 10px 10px',
        background: 'linear-gradient(180deg, #FFF 0%, #F7F7F7 5%)',
      }}
    >
      <div className='grid grid-cols-4 gap-2 pb-1'>
        <div className='col-span-2'>
          <ServingCalories servingSize={nutrition.servingSize} calories={nutrition.calories} />
        </div>
        <AllergenIcons allergens={detectAllergens(nutrition)} />
        <Nutrient nutrient='sodium' label='Sodium' unit='mg' amount={nutrition.sodium} />
      </div>

      <div className='grid grid-cols-4 gap-2 pb-2'>
        <NutrientGroup>
          <Nutrient
            className='flex-1'
            nutrient='totalFat'
            label='Total Fat'
            unit='g'
            amount={nutrition.totalFat}
          />
          <Nutrient
            className='flex-1'
            nutrient='saturatedFat'
            label='Saturated Fat'
            unit='g'
            amount={nutrition.saturatedFat}
          />
          <Nutrient
            className='flex-1'
            nutrient='transFat'
            label='Trans Fat'
            unit='g'
            amount={nutrition.transFat}
          />
        </NutrientGroup>
        <Nutrient
          className='pt-2'
          nutrient='protein'
          label='Protein'
          unit='g'
          amount={nutrition.protein}
        />
      </div>

      <div className='grid grid-cols-4 gap-2 pb-[2px]'>
        <NutrientGroup>
          <Nutrient
            className='flex-1'
            nutrient='totalCarbs'
            label='Total Carbs'
            unit='g'
            amount={nutrition.totalCarbs}
          />
          <Nutrient
            className='flex-1'
            nutrient='dietaryFiber'
            label='Dietary Fiber'
            unit='g'
            amount={nutrition.dietaryFiber}
          />
          <Nutrient
            className='flex-1'
            nutrient='totalSugars'
            label='Sugars'
            unit='g'
            amount={nutrition.totalSugars}
          />
        </NutrientGroup>
        <Nutrient
          className='pt-2'
          nutrient='cholesterol'
          label='Cholesterol'
          unit='mg'
          amount={nutrition.cholesterol}
        />
      </div>

      <Divider />

      <div className='grid grid-cols-4 gap-2 pb-1'>
        <Nutrient nutrient='vitaminD' label='Vitamin D' unit='mcg' amount={nutrition.vitaminD} />
        <Nutrient nutrient='calcium' label='Calcium' unit='mg' amount={nutrition.calcium} />
        <Nutrient nutrient='iron' label='Iron' unit='mg' amount={nutrition.iron} />
        <Nutrient nutrient='potassium' label='Potassium' unit='mg' amount={nutrition.potassium} />
      </div>

      <Divider />

      <IngredientsAndAllergens nutrition={nutrition} />
    </div>
  );
}
