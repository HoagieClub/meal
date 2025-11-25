import { NutrientInfo } from './types';
import { MacronutrientRowProps, MicronutrientRowProps } from './types';

const MACRONUTRIENTS = (nutrient: NutrientInfo): MacronutrientRowProps[] => {
  const calculateDVPercentage = (amount: number, dailyValue: number) => {
    return Math.round((amount / dailyValue) * 100);
  };
  return [
    {
      label: 'Total Fat',
      amount: nutrient?.totalFat,
      unit: 'g',
      dvPercent: calculateDVPercentage(nutrient?.totalFat, 78),
    },
    {
      label: 'Saturated Fat',
      amount: nutrient?.saturatedFat,
      unit: 'g',
      dvPercent: calculateDVPercentage(nutrient?.saturatedFat, 20),
    },
    {
      label: 'Cholesterol',
      amount: nutrient?.cholesterol,
      unit: 'mg',
      dvPercent: calculateDVPercentage(nutrient?.cholesterol, 300),
    },
    {
      label: 'Sodium',
      amount: nutrient?.sodium,
      unit: 'mg',
      dvPercent: calculateDVPercentage(nutrient?.sodium, 2300),
    },
    {
      label: 'Total Carbohydrates',
      amount: nutrient?.totalCarbohydrates,
      unit: 'g',
      dvPercent: calculateDVPercentage(nutrient?.totalCarbohydrates, 275),
    },
    {
      label: 'Dietary Fiber',
      amount: nutrient?.dietaryFiber,
      unit: 'g',
      dvPercent: calculateDVPercentage(nutrient?.dietaryFiber, 28),
    },
    {
      label: 'Sugars',
      amount: nutrient?.sugars,
      unit: 'g',
      dvPercent: null,
    },
    {
      label: 'Protein',
      amount: nutrient?.protein,
      unit: 'g',
      dvPercent: null,
    },
  ];
};

const MICRONUTRIENTS = (nutrient: NutrientInfo): MicronutrientRowProps[] => {
  return [
    {
      label: 'Vitamin D',
      dvPercent: nutrient?.vitaminD,
    },
    {
      label: 'Calcium',
      dvPercent: nutrient?.calcium,
    },
    {
      label: 'Iron',
      dvPercent: nutrient?.iron,
    },
    {
      label: 'Potassium',
      dvPercent: nutrient?.potassium,
    },
  ];
};

export { MACRONUTRIENTS, MICRONUTRIENTS };
