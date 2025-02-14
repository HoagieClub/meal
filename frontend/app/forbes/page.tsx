/**
 * @overview The Forbes College Dining Hall page.
 * 
 * Copyright © 2021-2025 Hoagie Club and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree or at https://github.com/hoagieclub/meal/LICENSE.
 *
 * Permission is granted under the MIT License to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Star,
  Users,
  AlertTriangle,
  Wheat,
  Apple,
  Leaf,
  ChevronDown,
  ChevronUp,
  CreditCard,
} from 'lucide-react';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  tags: string[];
  dietCategories: string[]; // e.g., 'halal', 'vegetarian', 'vegan'
  station: string;
  nutrition: {
    calories: string;
    allergens: string[];
    macros: {
      protein: { amount: string; dv: string };
      fat: { amount: string; dv: string };
      carbs: { amount: string; dv: string };
    };
  };
}

// Simulate menu data
const menuItems: MenuItem[] = [
  {
    id: 1,
    name: 'Korean Rice Bowl Bar',
    description:
      'Build-your-own rice bowl with mushroom bulgogi, fresh vegetables, and house-made kimchi',
    tags: ['vegetarian', 'gluten-free-option'],
    dietCategories: ['vegetarian'],
    station: 'Global Kitchen',
    nutrition: {
      calories: '1110',
      allergens: ['Wheat', 'Soybeans', 'Sesame', 'Gluten'],
      macros: {
        protein: { amount: '49.3g', dv: '' },
        fat: { amount: '35.4g', dv: '45%' },
        carbs: { amount: '149.3g', dv: '115%' },
      },
    },
  },
  {
    id: 2,
    name: 'Herb-Crusted Salmon',
    description:
      'Fresh Atlantic salmon with herbs and lemon, served with roasted seasonal vegetables',
    tags: ['gluten-free', 'dairy-free'],
    dietCategories: ['halal', 'pescatarian'],
    station: 'Grill',
    nutrition: {
      calories: '850',
      allergens: ['Fish'],
      macros: {
        protein: { amount: '42g', dv: '' },
        fat: { amount: '28g', dv: '35%' },
        carbs: { amount: '12g', dv: '4%' },
      },
    },
  },
  {
    id: 3,
    name: 'Quinoa Buddha Bowl',
    description:
      'Protein-rich quinoa with roasted chickpeas, kale, sweet potato, and tahini dressing',
    tags: ['vegan', 'gluten-free'],
    dietCategories: ['vegan', 'vegetarian'],
    station: 'Plant Forward',
    nutrition: {
      calories: '720',
      allergens: ['Sesame'],
      macros: {
        protein: { amount: '24g', dv: '' },
        fat: { amount: '32g', dv: '41%' },
        carbs: { amount: '89g', dv: '32%' },
      },
    },
  },
];

/**
 * Filters menu items based on active diet filters.
 *
 * @param items - The array of menu items to filter.
 * @param activeFilters - An array of diet filters (e.g., 'Vegetarian', 'Vegan', 'Halal').
 * @returns The menu items that match all the active filters.
 *
 * TODO: Enhance this logic if you need to combine filtering with other criteria (like tags).
 */
const filterMenuItems = (items: MenuItem[], activeFilters: string[]): MenuItem[] => {
  if (activeFilters.length === 0) return items;

  return items.filter(item => {
    // Normalize the diet categories for comparison.
    const diets = item.dietCategories.map(d => d.toLowerCase());
    return activeFilters.every(filter => diets.includes(filter.toLowerCase()));
  });
};

const ForbesMenu = () => {
  const [showNutrition, setShowNutrition] = useState(true);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});

  // Use our filtering helper to decide which items to render.
  const filteredMenuItems = filterMenuItems(menuItems, activeFilters);

  const toggleFavorite = (id: number) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(fav => fav !== id) : [...prev, id]
    );
  };

  const toggleCard = (id: number) => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Forbes Dining Hall</h1>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="bg-green-100">
              <Users className="w-4 h-4 mr-1" />
              Medium
            </Badge>
            <Badge variant="secondary" className="bg-blue-100">
              <CreditCard className="w-4 h-4 mr-1" />
              1 Meal Swipe Left This Week
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-semibold">Dinner</h2>
          <p className="text-muted-foreground">5:00 PM - 8:00 PM</p>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-wrap gap-2">
          {['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free'].map(filter => (
            <Button
              key={filter}
              variant={activeFilters.includes(filter) ? 'secondary' : 'outline'}
              onClick={() =>
                setActiveFilters(prev =>
                  prev.includes(filter)
                    ? prev.filter(f => f !== filter)
                    : [...prev, filter]
                )
              }
              className="h-8"
            >
              {filter}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show Nutrition</span>
          <Switch checked={showNutrition} onCheckedChange={setShowNutrition} />
        </div>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMenuItems.map(item => (
          <Card key={item.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl mb-1">{item.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{item.station}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`transition-transform hover:scale-110 ${
                    favorites.includes(item.id) ? 'text-yellow-500' : ''
                  }`}
                  onClick={() => toggleFavorite(item.id)}
                >
                  <Star
                    className="h-5 w-5"
                    fill={favorites.includes(item.id) ? 'currentColor' : 'none'}
                  />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-3">{item.description}</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {item.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="capitalize">
                    {tag}
                  </Badge>
                ))}
              </div>

              {showNutrition && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {item.nutrition.calories} Calories
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCard(item.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {expandedCards[item.id] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {expandedCards[item.id] && (
                    <div className="pt-3 space-y-4">
                      {/* Allergens */}
                      {item.nutrition.allergens.length > 0 && (
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <span className="text-sm font-medium text-amber-700">
                              Allergens
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {item.nutrition.allergens.map(allergen => (
                              <Badge
                                key={allergen}
                                variant="secondary"
                                className="bg-amber-100 text-amber-700"
                              >
                                {allergen}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Macros */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="flex flex-col items-center p-2 bg-blue-50 rounded-lg">
                          <Apple className="h-4 w-4 text-blue-500 mb-1" />
                          <span className="text-xs text-muted-foreground">Carbs</span>
                          <span className="text-sm font-bold">
                            {item.nutrition.macros.carbs.amount}
                          </span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-green-50 rounded-lg">
                          <Leaf className="h-4 w-4 text-green-500 mb-1" />
                          <span className="text-xs text-muted-foreground">Protein</span>
                          <span className="text-sm font-bold">
                            {item.nutrition.macros.protein.amount}
                          </span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-yellow-50 rounded-lg">
                          <Wheat className="h-4 w-4 text-yellow-500 mb-1" />
                          <span className="text-xs text-muted-foreground">Fat</span>
                          <span className="text-sm font-bold">
                            {item.nutrition.macros.fat.amount}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ForbesMenu;
