// components/FilterSidebar.tsx
import React, { useState } from 'react';
import {
  Pane,
  Text,
  Checkbox,
  SearchInput,
  Switch,
  UndoIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  majorScale,
  minorScale,
  useTheme,
  Button,
  Theme,
} from 'evergreen-ui';

// ——— PNG icons ————————————————————————
import cjlIcon from '../public/images/icons/cjl.png';
import defaultIcon from '../public/images/icons/default.png';
import forbesIcon from '../public/images/icons/forbes.png';
import gradIcon from '../public/images/icons/grad.png';
import whitmanIcon from '../public/images/icons/whitman.png';
import yehIcon from '../public/images/icons/yeh.png';
import rockyIcon from '../public/images/icons/rocky.png';
import { AllergenKey, DietKey } from '@/types/dining';

// ——— Map hall names → PNG src —————————————————————
const HALL_ICON_MAP: Record<string, string> = {
  'Center for Jewish Life': cjlIcon.src,
  'Forbes College': forbesIcon.src,
  'Graduate College': gradIcon.src,
  'Whitman & Butler Colleges': whitmanIcon.src,
  'Yeh College & NCW': yehIcon.src,
  'Rockefeller College': rockyIcon.src,
  'Mathey College': defaultIcon.src,
  'Frist Grill': defaultIcon.src,
};

// ——— Fallback hall emoji + style —————————————
const HALL_EMOJI_MAP: Record<string, string> = {
  'Rocky / Mathey': '🏛️',
};
const HALL_EMOJI_STYLE = (theme: any) => ({
  bg: theme.colors.gray100,
  border: theme.colors.gray300,
  color: theme.colors.gray700,
});

// ——— Dietary labels + styles —————————————————————
const DIET_LABEL_MAP: Record<DietKey, string> = {
  Vegetarian: 'V',
  Vegan: 'VG',
  Halal: 'H',
  Kosher: 'K',
};
const DIET_STYLE_MAP = (theme: Theme): Record<DietKey, any> => ({
  Vegetarian: {
    bg: theme.colors.green100,
    border: theme.colors.green700,
    color: theme.colors.green900,
  },
  Vegan: { bg: theme.colors.green50, border: theme.colors.green600, color: theme.colors.green800 },
  Halal: { bg: theme.colors.blue100, border: theme.colors.blue700, color: theme.colors.blue900 },
  Kosher: {
    bg: theme.colors.purple100,
    border: theme.colors.purple700,
    color: theme.colors.purple900,
  },
});

const ALLERGEN_STYLE_MAP = (theme: any): Record<AllergenKey, any> => ({
  Peanut: {
    bg: theme.colors.yellow100,
    border: theme.colors.yellow700,
    color: theme.colors.yellow900,
  },
  Coconut: {
    bg: theme.colors.orange100,
    border: theme.colors.orange700,
    color: theme.colors.orange900,
  },
  Eggs: {
    bg: theme.colors.yellow100,
    border: theme.colors.yellow700,
    color: theme.colors.yellow900,
  },
  Milk: { bg: theme.colors.blue100, border: theme.colors.blue700, color: theme.colors.blue900 },
  Wheat: {
    bg: theme.colors.yellow100,
    border: theme.colors.yellow700,
    color: theme.colors.yellow900,
  },
  Soybeans: {
    bg: theme.colors.green100,
    border: theme.colors.green700,
    color: theme.colors.green900,
  },
  Crustacean: { bg: theme.colors.red100, border: theme.colors.red700, color: theme.colors.red900 },
  Alcohol: {
    bg: theme.colors.purple100,
    border: theme.colors.purple700,
    color: theme.colors.purple900,
  },
  Gluten: {
    bg: theme.colors.orange100,
    border: theme.colors.orange700,
    color: theme.colors.orange900,
  },
  Fish: { bg: theme.colors.blue100, border: theme.colors.blue700, color: theme.colors.blue900 },
  Sesame: {
    bg: theme.colors.orange100,
    border: theme.colors.orange700,
    color: theme.colors.orange900,
  },
});

interface FilterSidebarProps {
  initialHalls: string[];
  tempHalls: string[];
  toggleHall: (h: string) => void;

  DIETARY: DietKey[];
  tempDietary: DietKey[];
  toggleDietary: (d: DietKey) => void;

  ALLERGENS: AllergenKey[];
  ALLERGEN_EMOJI: Record<string, string>;

  tempAllergens: AllergenKey[];
  toggleAllergen: (a: AllergenKey) => void;

  searchTerm: string;
  setSearchTerm: (s: string) => void;

  showNutrition: boolean;
  setShowNutrition: (f: boolean) => void;

  onReset: () => void;
  onApply: () => void;
}

export default function FilterSidebar({
  initialHalls,
  tempHalls,
  toggleHall,
  DIETARY,
  tempDietary,
  toggleDietary,
  ALLERGENS,
  ALLERGEN_EMOJI,
  tempAllergens,
  toggleAllergen,
  searchTerm,
  setSearchTerm,
  showNutrition,
  setShowNutrition,
  onReset,
  onApply,
}: FilterSidebarProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const dietStyles = DIET_STYLE_MAP(theme);
  const allergenStyles = ALLERGEN_STYLE_MAP(theme);
  const hallFallback = HALL_EMOJI_STYLE(theme);

  return (
    <Pane
      flexDirection='column'
      width={280}
      padding={majorScale(3)}
      className='max-w-[100%] hidden sm:inline z-20'
    >
      <Pane
        display='flex'
        background='white'
        borderRadius={12}
        maxHeight='100%'
        boxShadow='0 2px 12px rgba(0,0,0,0.06)'
        className='fixed sm:relative overflow-hidden flex-col'
      >
        <Pane
          background={theme.colors.gray100}
          borderBottom={`1px solid ${theme.colors.gray200}`}
          className='relative flex flex-col p-4'
        >
          {/* ↺ Reset */}
          <Pane
            display='flex'
            alignItems='center'
            cursor='pointer'
            onClick={onReset}
            background={theme.colors.gray100}
            marginBottom={minorScale(2)}
          >
            <UndoIcon size={14} color={theme.colors.gray700} />
            <Text marginLeft={minorScale(1)} size={300} color={theme.colors.gray700}>
              Reset Filters
            </Text>
          </Pane>
          <Pane borderBottom={`1px solid ${theme.colors.gray200}`} marginBottom={minorScale(2)} />
          {/* Food Search */}
          <Text
            size={300}
            fontWeight={600}
            color={theme.colors.gray800}
            marginBottom={minorScale(1)}
          >
            Search Food
          </Text>
          <SearchInput
            placeholder='Type to filter...'
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
          />
        </Pane>
        {/* Show Nutrition */}
        <Pane className='px-4 pt-4'>
          <Pane
            display='flex'
            alignItems='center'
            justifyContent='space-between'
            marginBottom={minorScale(3)}
          >
            <Text size={300} fontWeight={600} color={theme.colors.gray800}>
              Show Nutrition
            </Text>
            <Switch
              // size='small'
              checked={showNutrition}
              onChange={() => setShowNutrition(!showNutrition)}
            />
          </Pane>
          <Pane borderBottom={`1px solid ${theme.colors.gray200}`} />
        </Pane>
        <Pane className='p-4' overflowY='auto' height='100%'>
          {/* Toggle */}
          <Pane
            display='flex'
            alignItems='center'
            justifyContent='space-between'
            cursor='pointer'
            onClick={() => setOpen((o) => !o)}
            marginBottom={open ? minorScale(2) : 0}
          >
            <Text size={300} color={theme.colors.gray700}>
              {open ? 'Hide Filters' : 'Filter By'}
            </Text>
            {open ? (
              <ChevronUpIcon size={16} color='green600' />
            ) : (
              <ChevronDownIcon size={16} color='green600' />
            )}
          </Pane>

          <Pane
            borderBottom={open ? `1px solid ${theme.colors.gray200}` : undefined}
            marginBottom={minorScale(2)}
          />

          {open && (
            <Pane>
              {/* Dining Halls */}
              <Text
                size={300}
                fontWeight={600}
                color={theme.colors.gray800}
                marginBottom={minorScale(1)}
              >
                Dining Halls
              </Text>
              <Pane display='flex' flexDirection='column' marginBottom={minorScale(3)}>
                {initialHalls.map((h) => (
                  <Pane key={h} display='flex' alignItems='center' marginBottom={'2px'}>
                    <Checkbox checked={tempHalls.includes(h)} onChange={() => toggleHall(h)} />
                    <Pane marginX={minorScale(1)}>
                      {HALL_ICON_MAP[h] ? (
                        <img src={HALL_ICON_MAP[h]} alt={h} width={18} height={18} />
                      ) : (
                        <Pane
                          width={18}
                          height={18}
                          borderRadius={999}
                          background={hallFallback.bg}
                          border={`1px solid ${hallFallback.border}`}
                          display='flex'
                          alignItems='center'
                          justifyContent='center'
                        >
                          <Text size={200} color={hallFallback.color}>
                            {HALL_EMOJI_MAP[h]}
                          </Text>
                        </Pane>
                      )}
                    </Pane>
                    <Text size={300} color={theme.colors.gray900}>
                      {h.replace(' College', '')}
                    </Text>
                  </Pane>
                ))}
              </Pane>
              <Pane
                borderBottom={`1px solid ${theme.colors.gray200}`}
                marginBottom={minorScale(2)}
              />

              {/* Dietary Tags */}
              <Text
                size={300}
                fontWeight={600}
                color={theme.colors.gray800}
                marginBottom={minorScale(1)}
              >
                Dietary Tags
              </Text>
              <Pane display='flex' flexDirection='column' marginBottom={minorScale(3)}>
                {DIETARY.map((d) => {
                  const st = dietStyles[d];
                  return (
                    <Pane key={d} display='flex' alignItems='center' marginBottom={minorScale(1)}>
                      <Checkbox
                        checked={tempDietary.includes(d)}
                        onChange={() => toggleDietary(d)}
                      />
                      <Pane
                        width={18}
                        height={18}
                        borderRadius={3}
                        background={st?.bg}
                        border={`1px solid ${st?.border}`}
                        display='flex'
                        alignItems='center'
                        justifyContent='center'
                        marginX={minorScale(1)}
                        className='p-1'
                      >
                        <Text className='text-xs' color={st?.color} fontWeight={600}>
                          {DIET_LABEL_MAP[d]}
                        </Text>
                      </Pane>
                      <Text size={300} color={theme.colors.gray900}>
                        {d}
                      </Text>
                    </Pane>
                  );
                })}
              </Pane>
              <Pane
                borderBottom={`1px solid ${theme.colors.gray200}`}
                marginBottom={minorScale(2)}
              />

              {/* Allergen Tags */}
              <Text
                size={300}
                fontWeight={600}
                color={theme.colors.gray800}
                marginBottom={minorScale(1)}
              >
                Allergen Tags
              </Text>
              <Pane display='flex' flexDirection='column'>
                {ALLERGENS.map((a) => {
                  const st = allergenStyles[a as AllergenKey];
                  return (
                    <Pane key={a} display='flex' alignItems='center' marginBottom={minorScale(1)}>
                      <Checkbox
                        checked={tempAllergens.includes(a)}
                        onChange={() => toggleAllergen(a)}
                      />
                      <Pane
                        width={18}
                        height={18}
                        borderRadius={999}
                        background={st?.bg}
                        border={`1px solid ${st?.border}`}
                        display='flex'
                        alignItems='center'
                        justifyContent='center'
                        marginX={minorScale(1)}
                      >
                        <Text className='text-xs' color={st?.color}>
                          {ALLERGEN_EMOJI[a.toLowerCase()]}
                        </Text>
                      </Pane>
                      <Text size={300} color={theme.colors.gray900}>
                        {a}
                      </Text>
                    </Pane>
                  );
                })}
              </Pane>
            </Pane>
          )}
        </Pane>
        <Pane className='m-4'>
          <Button
            appearance='primary'
            intent='success'
            height={32}
            fontSize={300}
            onClick={onApply}
            className=' w-full'
          >
            Save
          </Button>
        </Pane>
      </Pane>
    </Pane>
  );
}
