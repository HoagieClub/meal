// /**
//  * @overview Panel display for meal information based on places.
//  *
//  * Copyright © 2021-2024 Hoagie Club and affiliates.
//  *
//  * This source code is licensed under the MIT license found in the
//  * LICENSE file in the root directory of this source tree or at
//  * 
//  *    https://github.com/hoagieclub/meal/LICENSE.
//  *
//  * Permission is granted under the MIT License to use, copy, modify, merge, publish, distribute, sublicense,
//  * and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.
//  */

// 'use client';

// import {
//   Pane,
//   majorScale,
//   minorScale,
//   Heading,
//   Spinner,
//   Button,
//   FullStackedChartIcon,
//   useTheme,
//   StatusIndicator,
//   Badge,
//   TabNavigation,
//   Tab,
//   Text,
//   TimeIcon,
//   PersonIcon,
//   FilterIcon,
//   CalendarIcon,
//   ChevronLeftIcon,
//   ChevronRightIcon,
// } from 'evergreen-ui';
// import Link from 'next/link';
// import { useUser } from '@auth0/nextjs-auth0/client';
// import AuthButton from '@/lib/hoagie-ui/AuthButton';
// import { useState } from 'react';
// import type { VenueType, PlaceStatus } from '@/types/places';

// import DiningLocations from '@/examples/locations';

// // Extended venue type for UI display
// // TODO: This is temporary logic for the UI and should be replaced with stronger types.
// interface UIVenue {
//   name: string;
//   status: PlaceStatus;
//   busyness: 'Low' | 'Medium' | 'High';
//   currentMeal: string;
//   hours: string;
//   popular: string[];
//   dietaryOptions: string[];
//   category: VenueType;
// }

// // Generate 14 days starting with today (in Eastern Time)
// // Index 0 is "Today", the rest are formatted as "Wed, Feb 13"
// const generateFourteenDays = () => {
//   const etFormatter = new Intl.DateTimeFormat('en-US', {
//     timeZone: 'America/New_York',
//     month: 'short',
//     day: 'numeric',
//     weekday: 'short',
//   });
//   const days = [];
//   for (let i = 0; i < 14; i++) {
//     const d = new Date();
//     d.setDate(d.getDate() + i);
//     const label = i === 0 ? 'Today' : etFormatter.format(d);
//     days.push({ label, date: d });
//   }
//   return days;
// };

// export default function Index() {
//   const { user, error, isLoading } = useUser();
//   const theme = useTheme();

//   // Sample dining hall data
//   const locations: UIVenue[] = [
//     {
//       name: 'Rocky / Mathey',
//       status: 'soon',
//       busyness: 'Medium',
//       currentMeal: 'Dinner',
//       hours: '5:00 PM - 8:00 PM',
//       popular: ['Orange Beef with Broccoli', 'Pan-Asian Orange Tofu'],
//       dietaryOptions: ['Vegetarian', 'Halal', 'Gluten-Free'],
//       category: 'residential'
//     },
//     {
//       name: 'Forbes',
//       status: 'yes',
//       busyness: 'High',
//       currentMeal: 'Dinner',
//       hours: '5:00 PM - 8:00 PM',
//       popular: ['Grilled Salmon', 'Beyond Burger'],
//       dietaryOptions: ['Vegan', 'Gluten-Free'],
//       category: 'residential'
//     },
//     {
//       name: 'Butler',
//       status: 'yes',
//       busyness: 'Low',
//       currentMeal: 'Dinner',
//       hours: '5:00 PM - 8:00 PM',
//       popular: ['Build Your Own Stir-Fry', 'Fresh Sushi Rolls'],
//       dietaryOptions: ['Vegetarian', 'Vegan', 'Halal'],
//       category: 'residential'
//     },
//     {
//       name: 'NCW / Yeh',
//       status: 'yes',
//       busyness: 'Medium',
//       currentMeal: 'Dinner',
//       hours: '5:00 PM - 8:00 PM',
//       popular: ['Korean BBQ Bowl', 'Vegetable Curry'],
//       dietaryOptions: ['Vegetarian', 'Gluten-Free', 'Halal'],
//       category: 'residential'
//     },
//     {
//       name: 'Whitman',
//       status: 'yes',
//       busyness: 'High',
//       currentMeal: 'Dinner',
//       hours: '5:00 PM - 8:00 PM',
//       popular: ['Wood-Fired Pizza', 'Mediterranean Bowl'],
//       dietaryOptions: ['Vegetarian', 'Vegan', 'Halal'],
//       category: 'residential'
//     }
//   ];

//   const [activeCategory, setActiveCategory] = useState<VenueType>('residential');
//   const filteredLocations = locations.filter(loc => loc.category === activeCategory);


//   // State for current week (0 = current week, 1 = next week) and selected day (index within the week)
//   const [weekIndex, setWeekIndex] = useState(0);
//   const [selectedDayIndex, setSelectedDayIndex] = useState(0);

//   // Generate 14 days and slice out the current week (7 days per week)
//   const daysArray = generateFourteenDays();
//   const currentWeekDays = daysArray.slice(weekIndex * 7, weekIndex * 7 + 7);
//   const selectedDay = currentWeekDays[selectedDayIndex];

//   // Formatter for full date (e.g., "Wednesday, February 13, 2025")
//   const fullFormatter = new Intl.DateTimeFormat('en-US', {
//     timeZone: 'America/New_York',
//     weekday: 'long',
//     month: 'long',
//     day: 'numeric',
//     year: 'numeric',
//   });
//   const fullDateString = fullFormatter.format(selectedDay.date);

//   // Helper to convert status to UI status
//   const getStatusDisplay = (status: PlaceStatus) => {
//     switch (status) {
//       case 'yes': return { text: 'Open', color: 'success' as const };
//       case 'no': return { text: 'Closed', color: 'danger' as const };
//       case 'soon': return { text: 'Closing Soon', color: 'warning' as const };
//     }
//   };

//   const MainContent = () => (
//     <Pane>
//       {/* Location Type Tabs */}
//       <Pane marginBottom={majorScale(3)}>
//         <TabNavigation>
//           <Tab
//             id="residential"
//             isSelected={activeCategory === 'residential'}
//             onSelect={() => setActiveCategory('residential')}
//           >
//             Dining Halls
//           </Tab>
//           <Tab
//             id="cafe"
//             isSelected={activeCategory === 'cafe'}
//             onSelect={() => setActiveCategory('cafe')}
//           >
//             Cafés
//           </Tab>
//           <Tab
//             id="specialty"
//             isSelected={activeCategory === 'specialty'}
//             onSelect={() => setActiveCategory('specialty')}
//           >
//             Specialty
//           </Tab>
//         </TabNavigation>
//       </Pane>

//       {/* Day Navigation with Arrow Buttons */}
//       <Pane
//         marginBottom={majorScale(3)}
//         display="flex"
//         alignItems="center"
//         paddingX={minorScale(2)}
//       >
//         <Button
//           height={28}
//           marginRight={minorScale(1)}
//           appearance="minimal"
//           disabled={weekIndex === 0}
//           onClick={() => {
//             setWeekIndex(0);
//             setSelectedDayIndex(0);
//           }}
//           style={{
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             padding: 0,
//             boxShadow: 'none',
//           }}
//         >
//           <ChevronLeftIcon size={16} />
//         </Button>

//         <Pane flex={1} overflow="hidden">
//           <TabNavigation display="flex" style={{ margin: 0, padding: 0 }}>
//             {currentWeekDays.map((day, idx) => {
//               const formattedDay = day.label === 'Today' ? 'Today' : day.label.replace(',', '');
//               return (
//                 <Tab
//                   key={`${day.label}-${idx}`}
//                   id={day.label}
//                   isSelected={idx === selectedDayIndex}
//                   onSelect={() => setSelectedDayIndex(idx)}
//                   height={28}
//                   style={{
//                     padding: '0 12px',
//                     margin: 0,
//                     whiteSpace: 'nowrap',
//                     borderBottom:
//                       idx === selectedDayIndex
//                         ? `2px solid ${theme.colors.blue500}`
//                         : '2px solid transparent',
//                   }}
//                 >
//                   {formattedDay}
//                 </Tab>
//               );
//             })}
//           </TabNavigation>
//         </Pane>

//         <Button
//           height={28}
//           marginLeft={minorScale(1)}
//           appearance="minimal"
//           disabled={weekIndex === 1}
//           onClick={() => {
//             setWeekIndex(1);
//             setSelectedDayIndex(0);
//           }}
//           style={{
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//             padding: 0,
//             boxShadow: 'none',
//           }}
//         >
//           <ChevronRightIcon size={16} />
//         </Button>
//       </Pane>

//       {/* Quick Filters */}
//       <Pane
//         display="flex"
//         gap={minorScale(1)}
//         marginBottom={majorScale(2)}
//         overflowX="auto"
//         paddingBottom={minorScale(1)}
//       >
//         {['Open Now', 'Vegetarian', 'Vegan', 'Halal', 'Gluten-Free'].map((filter) => (
//           <Badge key={filter} appearance="green" marginRight={8} cursor="pointer">
//             {filter}
//           </Badge>
//         ))}
//       </Pane>

//       {/* Selected Day Display */}
//       <Pane marginBottom={majorScale(2)}>
//         <Heading size={600}>{fullDateString}</Heading>
//       </Pane>

//       {/* Locations Grid */}
//       <Pane
//         display="grid"
//         gridTemplateColumns={['1fr', '1fr', 'repeat(2, 1fr)']}
//         gap={majorScale(2)}
//       >
//         {filteredLocations.map((location) => (
//           <Pane
//             key={location.name}
//             elevation={1}
//             backgroundColor="white"
//             borderRadius={8}
//             padding={majorScale(2)}
//           >
//             <Pane display="flex" justifyContent="space-between" alignItems="flex-start">
//               <Pane>
//                 <Heading size={700}>{location.name}</Heading>
//                 <Pane display="flex" gap={majorScale(2)} marginTop={minorScale(1)}>
//                   <Text size={300} color="muted">
//                     <TimeIcon marginRight={minorScale(1)} /> {location.hours}
//                   </Text>
//                   <Text size={300} color="muted">
//                     <PersonIcon marginRight={minorScale(1)} /> {location.busyness}
//                   </Text>
//                 </Pane>
//               </Pane>
//               {/* Use our new status helper */}
//               {(() => {
//                 const status = getStatusDisplay(location.status);
//                 return (
//                   <StatusIndicator color={status.color}>
//                     {status.text}
//                   </StatusIndicator>
//                 );
//               })()}
//             </Pane>

//             {/* Popular Items */}
//             <Pane marginY={majorScale(2)}>
//               <Text size={300} fontWeight={500}>
//                 <FullStackedChartIcon color={theme.colors.green500} marginRight={minorScale(1)} />
//                 Popular Now
//               </Text>
//               <Pane display="flex" gap={minorScale(2)} marginTop={minorScale(1)} flexWrap="wrap">
//                 {location.popular.map((item) => (
//                   <Pane
//                     key={item}
//                     backgroundColor={theme.colors.green100}
//                     borderRadius={8}
//                     padding={minorScale(2)}
//                   >
//                     <Text size={300}>{item}</Text>
//                   </Pane>
//                 ))}
//               </Pane>
//             </Pane>

//             {/* Dietary Options */}
//             <Pane display="flex" gap={minorScale(1)} flexWrap="wrap">
//               {location.dietaryOptions.map((option) => (
//                 <Badge key={option} color="neutral">
//                   {option}
//                 </Badge>
//               ))}
//             </Pane>
//           </Pane>
//         ))}
//       </Pane>
//     </Pane>
//   );

//   let Profile;
//   if (isLoading) Profile = <Spinner />;
//   else if (error) Profile = <div>{error.message}</div>;
//   else if (user) {
//     Profile = (
//       <Pane width="100%">
//         <Pane display="flex" justifyContent="space-between" marginBottom={majorScale(3)}>
//           <Button height={40} iconBefore={FilterIcon} appearance="minimal">
//             Filters
//           </Button>
//         </Pane>
//         <MainContent />
//       </Pane>
//     );
//   } else {
//     Profile = <AuthButton />;
//   }

//   return (
//     <Pane
//       display="flex"
//       justifyContent="center"
//       alignItems="center"
//       marginX={majorScale(1)}
//       paddingBottom={majorScale(4)}
//       paddingTop={majorScale(8)}
//     >
//       <Pane
//         borderRadius={8}
//         elevation={1}
//         background="white"
//         marginX={20}
//         maxWidth="800px"
//         width="100%"
//         paddingX={majorScale(3)}
//         paddingY={majorScale(4)}
//       >
//         <Heading size={900} className="hoagie" textAlign="center" marginBottom={majorScale(2)}>
//           Hoagie Meal
//         </Heading>

//         <Pane display="flex" flexDirection="column" alignItems="center">
//           {Profile}
//         </Pane>
//       </Pane>
//     </Pane>
//   );
// }

'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

// Simulate menu data
const menuItems = [
  {
    id: 1,
    name: 'Korean Rice Bowl Bar',
    description: 'Build-your-own rice bowl with mushroom bulgogi, fresh vegetables, and house-made kimchi',
    tags: ['vegetarian', 'gluten-free-option'],
    station: 'Global Kitchen',
    nutrition: {
      calories: '1110',
      allergens: ['Wheat', 'Soybeans', 'Sesame', 'Gluten'],
      macros: {
        protein: { amount: '49.3g', dv: '' },
        fat: { amount: '35.4g', dv: '45%' },
        carbs: { amount: '149.3g', dv: '115%' }
      }
    }
  },
  {
    id: 2,
    name: 'Herb-Crusted Salmon',
    description: 'Fresh Atlantic salmon with herbs and lemon, served with roasted seasonal vegetables',
    tags: ['gluten-free', 'dairy-free'],
    station: 'Grill',
    nutrition: {
      calories: '850',
      allergens: ['Fish'],
      macros: {
        protein: { amount: '42g', dv: '' },
        fat: { amount: '28g', dv: '35%' },
        carbs: { amount: '12g', dv: '4%' }
      }
    }
  },
  {
    id: 3,
    name: 'Quinoa Buddha Bowl',
    description: 'Protein-rich quinoa with roasted chickpeas, kale, sweet potato, and tahini dressing',
    tags: ['vegan', 'gluten-free'],
    station: 'Plant Forward',
    nutrition: {
      calories: '720',
      allergens: ['Sesame'],
      macros: {
        protein: { amount: '24g', dv: '' },
        fat: { amount: '32g', dv: '41%' },
        carbs: { amount: '89g', dv: '32%' }
      }
    }
  }
];

const DiningHallPage = () => {
  const [showNutrition, setShowNutrition] = useState(true);
  const [activeFilters, setActiveFilters] = useState([]);
  const [favorites, setFavorites] = useState(() => {
    // Load favorites from localStorage
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [expandedCards, setExpandedCards] = useState({});

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (id) => {
    setFavorites(prev => {
      const newFavorites = favorites.includes(id)
        ? prev.filter(fav => fav !== id)
        : [...prev, id];
      return newFavorites;
    });
  };

  const toggleCard = (id) => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id]
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
              Medium Capacity
            </Badge>
            <Badge variant="secondary" className="bg-blue-100">
              <CreditCard className="w-4 h-4 mr-1" />
              Meal Swipes Available
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
              variant={activeFilters.includes(filter) ? "secondary" : "outline"}
              onClick={() => setActiveFilters(prev =>
                prev.includes(filter)
                  ? prev.filter(f => f !== filter)
                  : [...prev, filter]
              )}
              className="h-8"
            >
              {filter}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show Nutrition</span>
          <Switch
            checked={showNutrition}
            onCheckedChange={setShowNutrition}
          />
        </div>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map(item => (
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
                  <Star className="h-5 w-5" fill={favorites.includes(item.id) ? 'currentColor' : 'none'} />
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
                            <span className="text-sm font-medium text-amber-700">Allergens</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {item.nutrition.allergens.map(allergen => (
                              <Badge key={allergen} variant="secondary" className="bg-amber-100 text-amber-700">
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
                          <span className="text-sm font-bold">{item.nutrition.macros.carbs.amount}</span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-green-50 rounded-lg">
                          <Leaf className="h-4 w-4 text-green-500 mb-1" />
                          <span className="text-xs text-muted-foreground">Protein</span>
                          <span className="text-sm font-bold">{item.nutrition.macros.protein.amount}</span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-yellow-50 rounded-lg">
                          <Wheat className="h-4 w-4 text-yellow-500 mb-1" />
                          <span className="text-xs text-muted-foreground">Fat</span>
                          <span className="text-sm font-bold">{item.nutrition.macros.fat.amount}</span>
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

export default DiningHallPage;
