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
  Theme,
} from 'evergreen-ui';

import {
  HALL_ICON_MAP,
  DIET_LABEL_MAP,
  ALLERGEN_STYLE_MAP,
  DIET_STYLE_MAP,
  ALLERGEN_EMOJI,
} from '@/styles';
import { DINING_HALLS, ALLERGENS, DIETARY_TAGS, AllergenType, DietaryTagType } from '@/data';
import { DiningHallType } from '@/data';

export default function FilterSidebar({
  usePreferencesObject,
  searchTerm,
  setSearchTerm,
}: {
  usePreferencesObject: any;
  searchTerm: string;
  setSearchTerm: (searchTerm: string) => void;
}) {
  const theme = useTheme();
  const dietStyles = DIET_STYLE_MAP(theme);
  const allergenStyles = ALLERGEN_STYLE_MAP(theme);
  const ICON_SIZE = 20;

  const [filtersOpen, setFiltersOpen] = useState(false);
  const {
    diningHalls,
    dietaryRestrictions,
    allergens,
    showNutrition,
    setDiningHalls,
    setDietaryRestrictions,
    setAllergens,
    setShowNutrition,
    updatePreferencesBackend,
    resetPreferencesBackend,
  } = usePreferencesObject;

  const [localDiningHalls, setLocalDiningHalls] = useState<DiningHallType[]>(DINING_HALLS);
  const [localDietaryRestrictions, setLocalDietaryRestrictions] = useState<DietaryTagType[]>([]);
  const [localShowNutrition, setLocalShowNutrition] = useState<boolean>(true);
  const [localAllergens, setLocalAllergens] = useState<AllergenType[]>([]);

  useEffect(() => {
    setLocalDiningHalls(diningHalls);
    setLocalDietaryRestrictions(dietaryRestrictions);
    setLocalShowNutrition(showNutrition);
    setLocalAllergens(allergens);
  }, [diningHalls, dietaryRestrictions, showNutrition, allergens]);

  const toggleLocalDiningHalls = (diningHall: DiningHallType) => {
    setLocalDiningHalls((prev) =>
      prev.includes(diningHall) ? prev.filter((h) => h !== diningHall) : [...prev, diningHall]
    );
  };

  const toggleLocalDietaryRestrictions = (dietKey: DietaryTagType) => {
    setLocalDietaryRestrictions((prev) =>
      prev.includes(dietKey) ? prev.filter((d) => d !== dietKey) : [...prev, dietKey]
    );
  };

  const toggleLocalAllergens = (allergen: AllergenType) => {
    setLocalAllergens((prev: AllergenType[]) =>
      prev.includes(allergen)
        ? prev.filter((a: AllergenType) => a !== allergen)
        : [...prev, allergen]
    );
  };

  const handleReset = () => {
    setLocalDiningHalls(DINING_HALLS);
    setLocalDietaryRestrictions([]);
    setLocalAllergens([]);
    setLocalShowNutrition(true);
    setSearchTerm('');
    resetPreferencesBackend();
  };

  const handleApply = () => {
    setDiningHalls(localDiningHalls);
    setDietaryRestrictions(localDietaryRestrictions);
    setAllergens(localAllergens);
    setShowNutrition(localShowNutrition);
    updatePreferencesBackend({
      dietaryRestrictions: localDietaryRestrictions,
      allergens: localAllergens,
      diningHalls: localDiningHalls,
      showNutrition: localShowNutrition,
    });
  };

  const renderDiningHallRow = (diningHall: DiningHallType) => {
    const diningHallText = diningHall.replace(' College', '');
    const checked = localDiningHalls.includes(diningHall);

    return (
      <Pane key={diningHall} display='flex' alignItems='center' marginBottom='2px'>
        <Checkbox checked={checked} onChange={() => toggleLocalDiningHalls(diningHall)} />
        <Pane marginX={minorScale(2)}>
          <img
            src={HALL_ICON_MAP[diningHall]}
            alt={diningHall}
            width={ICON_SIZE}
            height={ICON_SIZE}
          />
        </Pane>
        <Text size={300} color={theme.colors.gray900}>
          {diningHallText}
        </Text>
      </Pane>
    );
  };

  const renderDietaryRow = (dietKey: DietaryTagType) => {
    const style = dietStyles[dietKey];
    const checked = localDietaryRestrictions.includes(dietKey);

    return (
      <Pane key={dietKey} display='flex' alignItems='center' marginBottom={minorScale(1)}>
        <Checkbox checked={checked} onChange={() => toggleLocalDietaryRestrictions(dietKey)} />
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

  const renderAllergenRow = (allergen: AllergenType) => {
    const style = allergenStyles[allergen];
    const checked = localAllergens.includes(allergen);
    const emoji = ALLERGEN_EMOJI[allergen as AllergenType];

    return (
      <Pane key={allergen} display='flex' alignItems='center' marginBottom={minorScale(1)}>
        <Checkbox checked={checked} onChange={() => toggleLocalAllergens(allergen)} />
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
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
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
              onChange={() => setLocalShowNutrition((prev: boolean) => !prev)}
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
                {DINING_HALLS.map(renderDiningHallRow)}
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

        <Pane className='m-4' display='flex' flexDirection='row' gap={minorScale(2)}>
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
          <Button
            appearance='primary'
            intent='danger'
            height={32}
            fontSize={300}
            onClick={handleReset}
            className='w-full'
          >
            Reset
          </Button>
        </Pane>
      </Pane>
    </Pane>
  );
}
