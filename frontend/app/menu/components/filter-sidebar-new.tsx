import React, { useEffect, useState } from 'react';
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
} from 'evergreen-ui';

import { AllergenKey, DietKey } from '../types';
import {
  initialSelectedHalls,
  DIETARY_TAGS,
  ALLERGENS,
  ALLERGEN_EMOJI,
  HALL_ICON_MAP,
  DIET_STYLE_MAP,
  DIET_LABEL_MAP,
  ALLERGEN_STYLE_MAP,
} from '../data';

interface FilterSidebarProps {
  applied: {
    halls: string[];
    dietary: DietKey[];
    allergens: AllergenKey[];
    searchTerm: string;
    showNutrition: boolean;
  };
  onApply: (updated: {
    halls: string[];
    dietary: DietKey[];
    allergens: AllergenKey[];
    searchTerm: string;
    showNutrition: boolean;
  }) => void;
}

export default function FilterSidebar({ applied, onApply }: FilterSidebarProps) {
  const theme = useTheme();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [localHalls, setLocalHalls] = useState<string[]>(applied.halls);
  const [localDietary, setLocalDietary] = useState<DietKey[]>(applied.dietary);
  const [localAllergens, setLocalAllergens] = useState<AllergenKey[]>(applied.allergens);
  const [localSearchTerm, setLocalSearchTerm] = useState(applied.searchTerm);
  const [localShowNutrition, setLocalShowNutrition] = useState(applied.showNutrition);

  const dietStyles = DIET_STYLE_MAP(theme);
  const allergenStyles = ALLERGEN_STYLE_MAP(theme);
  const ICON_SIZE = 20;

  useEffect(() => {
    setLocalHalls(applied.halls);
    setLocalDietary(applied.dietary);
    setLocalAllergens(applied.allergens);
    setLocalSearchTerm(applied.searchTerm);
    setLocalShowNutrition(applied.showNutrition);
  }, [applied]);

  const toggleHall = (hall: string) => {
    setLocalHalls((prev) =>
      prev.includes(hall) ? prev.filter((h) => h !== hall) : [...prev, hall]
    );
  };

  const toggleDietary = (dietKey: DietKey) => {
    setLocalDietary((prev) =>
      prev.includes(dietKey) ? prev.filter((d) => d !== dietKey) : [...prev, dietKey]
    );
  };

  const toggleAllergen = (allergen: AllergenKey) => {
    setLocalAllergens((prev) =>
      prev.includes(allergen) ? prev.filter((a) => a !== allergen) : [...prev, allergen]
    );
  };

  const handleReset = () => {
    setLocalHalls(initialSelectedHalls);
    setLocalDietary([]);
    setLocalAllergens([]);
    setLocalSearchTerm('');
    setLocalShowNutrition(true);
  };

  const handleApply = () => {
    onApply({
      halls: localHalls,
      dietary: localDietary,
      allergens: localAllergens,
      searchTerm: localSearchTerm,
      showNutrition: localShowNutrition,
    });
  };

  const renderDiningHallRow = (hall: string) => {
    const hallText = hall.replace(' College', '');
    const checked = localHalls.includes(hall);

    return (
      <Pane key={hall} display='flex' alignItems='center' marginBottom='2px'>
        <Checkbox checked={checked} onChange={() => toggleHall(hall)} />
        <Pane marginX={minorScale(2)}>
          <img src={HALL_ICON_MAP[hall]} alt={hall} width={ICON_SIZE} height={ICON_SIZE} />
        </Pane>
        <Text size={300} color={theme.colors.gray900}>
          {hallText}
        </Text>
      </Pane>
    );
  };

  const renderDietaryRow = (dietKey: DietKey) => {
    const style = dietStyles[dietKey];
    const checked = localDietary.includes(dietKey);

    return (
      <Pane key={dietKey} display='flex' alignItems='center' marginBottom={minorScale(1)}>
        <Checkbox checked={checked} onChange={() => toggleDietary(dietKey)} />
        <Pane
          width={ICON_SIZE}
          height={ICON_SIZE}
          borderRadius={3}
          background={style?.bg}
          display='flex'
          alignItems='center'
          justifyContent='center'
          marginX={minorScale(2)}
          className='p-1'
        >
          <Text className='text-xs' color={style?.color} fontWeight={600}>
            {DIET_LABEL_MAP[dietKey]}
          </Text>
        </Pane>
        <Text size={300} color={theme.colors.gray900}>
          {dietKey}
        </Text>
      </Pane>
    );
  };

  const renderAllergenRow = (allergen: AllergenKey) => {
    const style = allergenStyles[allergen];
    const checked = localAllergens.includes(allergen);
    const emoji = ALLERGEN_EMOJI[allergen.toLowerCase()];

    return (
      <Pane key={allergen} display='flex' alignItems='center' marginBottom={minorScale(1)}>
        <Checkbox checked={checked} onChange={() => toggleAllergen(allergen)} />
        <Pane
          width={ICON_SIZE}
          height={ICON_SIZE}
          borderRadius={999}
          background={style?.bg}
          display='flex'
          alignItems='center'
          justifyContent='center'
          marginX={minorScale(2)}
        >
          <Text className='text-xs' color={style?.color}>
            {emoji}
          </Text>
        </Pane>
        <Text size={300} color={theme.colors.gray900}>
          {allergen}
        </Text>
      </Pane>
    );
  };

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
          <Pane
            display='flex'
            alignItems='center'
            cursor='pointer'
            onClick={handleReset}
            background={theme.colors.gray100}
            marginBottom={minorScale(2)}
          >
            <UndoIcon size={14} color={theme.colors.gray700} />
            <Text marginLeft={minorScale(1)} size={300} color={theme.colors.gray700}>
              Reset Filters
            </Text>
          </Pane>

          <Pane borderBottom={`1px solid ${theme.colors.gray200}`} marginBottom={minorScale(2)} />

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
            value={localSearchTerm}
            onChange={(e: any) => setLocalSearchTerm(e.target.value)}
          />
        </Pane>

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
              checked={localShowNutrition}
              onChange={() => setLocalShowNutrition((prev) => !prev)}
            />
          </Pane>
          <Pane borderBottom={`1px solid ${theme.colors.gray200}`} />
        </Pane>

        <Pane className='p-4' overflowY='auto' height='100%'>
          <Pane
            display='flex'
            alignItems='center'
            justifyContent='space-between'
            cursor='pointer'
            onClick={() => setFiltersOpen((prev) => !prev)}
            marginBottom={filtersOpen ? minorScale(2) : 0}
          >
            <Text size={300} color={theme.colors.gray700}>
              {filtersOpen ? 'Hide Filters' : 'Filter By'}
            </Text>
            {filtersOpen ? (
              <ChevronUpIcon size={16} color='green600' />
            ) : (
              <ChevronDownIcon size={16} color='green600' />
            )}
          </Pane>

          <Pane
            borderBottom={filtersOpen ? `1px solid ${theme.colors.gray200}` : undefined}
            marginBottom={minorScale(2)}
          />

          {filtersOpen && (
            <Pane>
              <Text
                size={300}
                fontWeight={600}
                color={theme.colors.gray800}
                marginBottom={minorScale(1)}
              >
                Dining Halls
              </Text>
              <Pane display='flex' flexDirection='column' marginBottom={minorScale(3)}>
                {initialSelectedHalls.map(renderDiningHallRow)}
              </Pane>

              <Pane
                borderBottom={`1px solid ${theme.colors.gray200}`}
                marginBottom={minorScale(2)}
              />

              <Text
                size={300}
                fontWeight={600}
                color={theme.colors.gray800}
                marginBottom={minorScale(1)}
              >
                Dietary Tags
              </Text>
              <Pane display='flex' flexDirection='column' marginBottom={minorScale(3)}>
                {DIETARY_TAGS.map(renderDietaryRow)}
              </Pane>

              <Pane
                borderBottom={`1px solid ${theme.colors.gray200}`}
                marginBottom={minorScale(2)}
              />

              <Text
                size={300}
                fontWeight={600}
                color={theme.colors.gray800}
                marginBottom={minorScale(1)}
              >
                Allergen Tags
              </Text>
              <Pane display='flex' flexDirection='column'>
                {ALLERGENS.map(renderAllergenRow)}
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
            onClick={handleApply}
            className='w-full'
          >
            Save
          </Button>
        </Pane>
      </Pane>
    </Pane>
  );
}
