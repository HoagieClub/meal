'use client';

import { calculateDVPercentage } from '@/utils/dining';
import { ALLERGEN_ICON_MAP } from '@/data';
import { Allergen } from '@/types/types';
import { ServingCalories, AllergensDisplay, NutrientCell, Ingredients } from '.';

export default function NutritionAccordionContent({ item }: any) {
  const nutrition = item.nutrition;
  const ingredients = nutrition?.ingredients;
  const allergens = nutrition?.allergens;

  if (!nutrition) {
    return <div className='p-4 text-gray-500'>No nutrition information available</div>;
  }

  const ingredientsString = ingredients ?? '';
  const searchText = `${allergens || ''} ${ingredientsString}`.toLowerCase();
  const allergensArray = (Object.keys(ALLERGEN_ICON_MAP) as Allergen[]).filter((allergen) =>
    searchText.includes(allergen.toLowerCase())
  );

  return (
    <div
      className='px-4 pt-2 pb-3'
      style={{
        borderRadius: '0 0 10px 10px',
        background: 'linear-gradient(180deg, #FFF 0%, #F7F7F7 5%)',
      }}
    >
      {/* Row 1: Serving Size + Calories (2 cols) | Allergens | Sodium */}
      <div className='grid grid-cols-4 gap-2 pb-1'>
        <div className='col-span-2'>
          <ServingCalories
            servingSize={nutrition.servingSize}
            servingUnit={nutrition.servingUnit}
            calories={nutrition.calories}
          />
        </div>
        <AllergensDisplay allergens={allergensArray} />
        <NutrientCell
          label='Sodium'
          amount={nutrition.sodium}
          unit='mg'
          rdvPercent={calculateDVPercentage(nutrition.sodium ?? 0, 2300)}
        />
      </div>

      {/* Row 2: Total Fat | Saturated Fat | Trans Fat | Protein */}
      <div className='grid grid-cols-4 gap-2 pb-2'>
        <div
          className='col-span-3 p-[2px] -ml-[9px]'
          style={{
            borderRadius: '7px',
            background: 'linear-gradient(0deg, #F7F7F7, #E5E5E5)',
          }}
        >
          <div
            className='flex gap-2 bg-[#F7F7F7] pl-[8px] pt-[5px]'
            style={{ borderRadius: '5px' }}
          >
            <NutrientCell
              className='flex-1'
              label='Total Fat'
              amount={nutrition.totalFat}
              unit='g'
              rdvPercent={calculateDVPercentage(nutrition.totalFat ?? 0, 78)}
            />
            <NutrientCell
              className='flex-1'
              label='Saturated Fat'
              amount={nutrition.saturatedFat}
              unit='g'
              rdvPercent={calculateDVPercentage(nutrition.saturatedFat ?? 0, 20)}
            />
            <NutrientCell
              className='flex-1'
              label='Trans Fat'
              amount={nutrition.transFat}
              unit='g'
              rdvPercent={calculateDVPercentage(nutrition.transFat ?? 0, 2)}
            />
          </div>
        </div>
        <NutrientCell
          className='pt-2'
          label='Protein'
          amount={nutrition.protein}
          unit='g'
          rdvPercent={calculateDVPercentage(nutrition.protein ?? 0, 50)}
        />
      </div>

      {/* Row 3: Total Carbs | Dietary Fiber | Sugars | Cholesterol */}
      <div className='grid grid-cols-4 gap-2 pb-[2px]'>
        <div
          className='col-span-3 p-[2px] -ml-[9px]'
          style={{
            borderRadius: '7px',
            background: 'linear-gradient(0deg, #F7F7F7, #E5E5E5)',
          }}
        >
          <div
            className='flex gap-2 bg-[#F7F7F7] pl-[8px] pt-[5px]'
            style={{ borderRadius: '5px' }}
          >
            <NutrientCell
              className='flex-1'
              label='Total Carbs'
              amount={nutrition.totalCarbohydrates}
              unit='g'
              rdvPercent={calculateDVPercentage(nutrition.totalCarbohydrates ?? 0, 275)}
            />
            <NutrientCell
              className='flex-1'
              label='Dietary Fiber'
              amount={nutrition.dietaryFiber}
              unit='g'
              rdvPercent={calculateDVPercentage(nutrition.dietaryFiber ?? 0, 28)}
            />
            <NutrientCell
              className='flex-1'
              label='Sugars'
              amount={nutrition.sugars}
              unit='g'
              rdvPercent={calculateDVPercentage(nutrition.sugars ?? 0, 50)}
            />
          </div>
        </div>
        <NutrientCell
          className='pt-2'
          label='Cholesterol'
          amount={nutrition.cholesterol}
          unit='mg'
          rdvPercent={calculateDVPercentage(nutrition.cholesterol ?? 0, 300)}
        />
      </div>

      <div className='w-full h-[2px] rounded bg-[#E9E9E9] my-2' />

      {/* Row 4: Vitamin D | Calcium | Iron | Potassium */}
      <div className='grid grid-cols-4 gap-2 pb-1'>
        <NutrientCell
          label='Vitamin D'
          amount={nutrition.vitaminD}
          unit='mcg'
          rdvPercent={calculateDVPercentage(nutrition.vitaminD ?? 0, 20)}
        />
        <NutrientCell
          label='Calcium'
          amount={nutrition.calcium}
          unit='mg'
          rdvPercent={calculateDVPercentage(nutrition.calcium ?? 0, 1300)}
        />
        <NutrientCell
          label='Iron'
          amount={nutrition.iron}
          unit='mg'
          rdvPercent={calculateDVPercentage(nutrition.iron ?? 0, 18)}
        />
        <NutrientCell
          label='Potassium'
          amount={nutrition.potassium}
          unit='mg'
          rdvPercent={calculateDVPercentage(nutrition.potassium ?? 0, 4700)}
        />
      </div>

      <div className='w-full h-[2px] rounded bg-[#E9E9E9] my-2' />

      {/* Ingredients & Allergens (full width) */}
      {ingredientsString && <Ingredients ingredients={ingredientsString} />}
      {allergens && (
        <div className={ingredientsString ? 'mt-2' : ''}>
          <Ingredients ingredients={allergens} label='Allergens' />
        </div>
      )}
    </div>
  );
}
