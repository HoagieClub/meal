/**
 * @overview Panel display for meal information based on places.
 *
 * Copyright © 2021-2025 Hoagie Club and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree or at
 * 
 *    https://github.com/hoagieclub/meal/LICENSE.
 *
 * Permission is granted under the MIT License to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.
 */

'use client';

import {
  Pane,
  majorScale,
  minorScale,
  Heading,
  Spinner,
  Button,
  FullStackedChartIcon,
  useTheme,
  StatusIndicator,
  Badge,
  TabNavigation,
  Tab,
  Text,
  TimeIcon,
  PersonIcon,
  FilterIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'evergreen-ui';
import Link from 'next/link';
import { request } from '@/lib/http';
import { useUser } from '@auth0/nextjs-auth0/client';
import AuthButton from '@/lib/hoagie-ui/AuthButton';
import { useEffect, useState } from 'react';
import { classifyVenue, Venue } from '@/utils/places';
import type { VenueType, PlaceStatus } from '@/types/places';

import DiningLocations from '@/examples/locations';

// Extended venue type for UI display
// TODO: This is temporary logic for the UI and should be replaced with stronger types.
interface UIVenue {
  name: string;
  status: PlaceStatus;
  busyness: 'Low' | 'Medium' | 'High';
  currentMeal: string;
  hours: string;
  popular: string[];
  dietaryOptions: string[];
  category: VenueType;
}

// Generate 14 days starting with today (in Eastern Time)
// Index 0 is "Today", the rest are formatted as "Wed, Feb 13"
const generateFourteenDays = () => {
  const etFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });
  const days = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const label = i === 0 ? 'Today' : etFormatter.format(d);
    days.push({ label, date: d });
  }
  return days;
};

export default function Index() {
  const { user, error, isLoading } = useUser();
  const theme = useTheme();

  // Sample dining hall data
  const locations: UIVenue[] = [
    {
      name: 'Rocky / Mathey',
      status: 'soon',
      busyness: 'Medium',
      currentMeal: 'Dinner',
      hours: '5:00 PM - 8:00 PM',
      popular: ['Orange Beef with Broccoli', 'Pan-Asian Orange Tofu'],
      dietaryOptions: ['Vegetarian', 'Halal', 'Gluten-Free'],
      category: 'residential'
    },
    {
      name: 'Forbes',
      status: 'yes',
      busyness: 'High',
      currentMeal: 'Dinner',
      hours: '5:00 PM - 8:00 PM',
      popular: ['Grilled Salmon', 'Beyond Burger'],
      dietaryOptions: ['Vegan', 'Gluten-Free'],
      category: 'residential'
    },
    {
      name: 'Butler',
      status: 'yes',
      busyness: 'Low',
      currentMeal: 'Dinner',
      hours: '5:00 PM - 8:00 PM',
      popular: ['Build Your Own Stir-Fry', 'Fresh Sushi Rolls'],
      dietaryOptions: ['Vegetarian', 'Vegan', 'Halal'],
      category: 'residential'
    },
    {
      name: 'NCW / Yeh',
      status: 'yes',
      busyness: 'Medium',
      currentMeal: 'Dinner',
      hours: '5:00 PM - 8:00 PM',
      popular: ['Korean BBQ Bowl', 'Vegetable Curry'],
      dietaryOptions: ['Vegetarian', 'Gluten-Free', 'Halal'],
      category: 'residential'
    },
    {
      name: 'Whitman',
      status: 'yes',
      busyness: 'High',
      currentMeal: 'Dinner',
      hours: '5:00 PM - 8:00 PM',
      popular: ['Wood-Fired Pizza', 'Mediterranean Bowl'],
      dietaryOptions: ['Vegetarian', 'Vegan', 'Halal'],
      category: 'residential'
    },
    {
      name: 'Cafe',
      status: 'yes',
      busyness: 'High',
      currentMeal: 'Dinner',
      hours: '5:00 PM - 8:00 PM',
      popular: ['Wood-Fired Pizza', 'Mediterranean Bowl'],
      dietaryOptions: ['Vegetarian', 'Vegan', 'Halal'],
      category: 'cafe'
    },
    {
      name: 'Specialty',
      status: 'yes',
      busyness: 'High',
      currentMeal: 'Dinner',
      hours: '5:00 PM - 8:00 PM',
      popular: ['Wood-Fired Pizza', 'Mediterranean Bowl'],
      dietaryOptions: ['Vegetarian', 'Vegan', 'Halal'],
      category: 'specialty'
    },
  ];

  const Page = () => {
    const [venues, setVenues] = useState<Venue[]>([]);
    useEffect(() => {
      // Fetch dining locations
      fetch("/dining/locations")
        .then((response) => response.json())
        .then((data) => {
          const classifiedVenues = data.map((venue: { name: string }) => ({
            name: venue.name,
            category: classifyVenue(venue.name),
          }));
  
          setVenues(classifiedVenues);
          console.log(classifiedVenues);
        })
        .catch((error) => console.error("Error fetching venues:", error));
    }, []);

  }


  const [activeCategory, setActiveCategory] = useState<VenueType>('residential');
  const filteredLocations = locations.filter(loc => loc.category === activeCategory);


  // State for current week (0 = current week, 1 = next week) and selected day (index within the week)
  const [weekIndex, setWeekIndex] = useState(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Generate 14 days and slice out the current week (7 days per week)
  const daysArray = generateFourteenDays();
  const currentWeekDays = daysArray.slice(weekIndex * 7, weekIndex * 7 + 7);
  const selectedDay = currentWeekDays[selectedDayIndex];

  // Formatter for full date (e.g., "Wednesday, February 13, 2025")
  const fullFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const fullDateString = fullFormatter.format(selectedDay.date);

  // Helper to convert status to UI status
  const getStatusDisplay = (status: PlaceStatus) => {
    switch (status) {
      case 'yes': return { text: 'Open', color: 'success' as const };
      case 'no': return { text: 'Closed', color: 'danger' as const };
      case 'soon': return { text: 'Closing Soon', color: 'warning' as const };
    }
  };

  const MainContent = () => (
    <Pane>
      {/* Location Type Tabs */}
      <Pane marginBottom={majorScale(3)}>
        <TabNavigation>
          <Tab
            id="residential"
            isSelected={activeCategory === 'residential'}
            onSelect={() => setActiveCategory('residential')}
          >
            Dining Halls
          </Tab>
          <Tab
            id="cafe"
            isSelected={activeCategory === 'cafe'}
            onSelect={() => setActiveCategory('cafe')}
          >
            Cafés
          </Tab>
          <Tab
            id="specialty"
            isSelected={activeCategory === 'specialty'}
            onSelect={() => setActiveCategory('specialty')}
          >
            Specialty
          </Tab>
        </TabNavigation>
      </Pane>

      {/* Day Navigation with Arrow Buttons */}
      <Pane
        marginBottom={majorScale(3)}
        display="flex"
        alignItems="center"
        paddingX={minorScale(2)}
      >
        <Button
          height={28}
          marginRight={minorScale(1)}
          appearance="minimal"
          disabled={weekIndex === 0}
          onClick={() => {
            setWeekIndex(0);
            setSelectedDayIndex(0);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            boxShadow: 'none',
          }}
        >
          <ChevronLeftIcon size={16} />
        </Button>

        <Pane flex={1} overflow="hidden">
          <TabNavigation display="flex" style={{ margin: 0, padding: 0 }}>
            {currentWeekDays.map((day, idx) => {
              const formattedDay = day.label === 'Today' ? 'Today' : day.label.replace(',', '');
              return (
                <Tab
                  key={`${day.label}-${idx}`}
                  id={day.label}
                  isSelected={idx === selectedDayIndex}
                  onSelect={() => setSelectedDayIndex(idx)}
                  height={28}
                  style={{
                    padding: '0 12px',
                    margin: 0,
                    whiteSpace: 'nowrap',
                    borderBottom:
                      idx === selectedDayIndex
                        ? `2px solid ${theme.colors.blue500}`
                        : '2px solid transparent',
                  }}
                >
                  {formattedDay}
                </Tab>
              );
            })}
          </TabNavigation>
        </Pane>

        <Button
          height={28}
          marginLeft={minorScale(1)}
          appearance="minimal"
          disabled={weekIndex === 1}
          onClick={() => {
            setWeekIndex(1);
            setSelectedDayIndex(0);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            boxShadow: 'none',
          }}
        >
          <ChevronRightIcon size={16} />
        </Button>
      </Pane>

      {/* Quick Filters */}
      <Pane
        display="flex"
        gap={minorScale(1)}
        marginBottom={majorScale(2)}
        overflowX="auto"
        paddingBottom={minorScale(1)}
      >
        {['Open Now', 'Vegetarian', 'Vegan', 'Halal', 'Gluten-Free'].map((filter) => (
          <Badge key={filter} appearance="green" marginRight={8} cursor="pointer">
            {filter}
          </Badge>
        ))}
      </Pane>

      {/* Selected Day Display */}
      <Pane marginBottom={majorScale(2)}>
        <Heading size={600}>{fullDateString}</Heading>
      </Pane>

      {/* Locations Grid */}
      <Pane
        display="grid"
        gridTemplateColumns={['1fr', '1fr', 'repeat(2, 1fr)']}
        gap={majorScale(2)}
      >
        {filteredLocations.map((location) => (
          <Pane
            key={location.name}
            elevation={1}
            backgroundColor="white"
            borderRadius={8}
            padding={majorScale(2)}
          >
            <Pane display="flex" justifyContent="space-between" alignItems="flex-start">
              <Pane>
                <Heading size={700}>{location.name}</Heading>
                <Pane display="flex" gap={majorScale(2)} marginTop={minorScale(1)}>
                  <Text size={300} color="muted">
                    <TimeIcon marginRight={minorScale(1)} /> {location.hours}
                  </Text>
                  <Text size={300} color="muted">
                    <PersonIcon marginRight={minorScale(1)} /> {location.busyness}
                  </Text>
                </Pane>
              </Pane>
              {/* Use our new status helper */}
              {(() => {
                const status = getStatusDisplay(location.status);
                return (
                  <StatusIndicator color={status.color}>
                    {status.text}
                  </StatusIndicator>
                );
              })()}
            </Pane>

            {/* Popular Items */}
            <Pane marginY={majorScale(2)}>
              <Text size={300} fontWeight={500}>
                <FullStackedChartIcon color={theme.colors.green500} marginRight={minorScale(1)} />
                Popular Now
              </Text>
              <Pane display="flex" gap={minorScale(2)} marginTop={minorScale(1)} flexWrap="wrap">
                {location.popular.map((item) => (
                  <Pane
                    key={item}
                    backgroundColor={theme.colors.green100}
                    borderRadius={8}
                    padding={minorScale(2)}
                  >
                    <Text size={300}>{item}</Text>
                  </Pane>
                ))}
              </Pane>
            </Pane>

            {/* Dietary Options */}
            <Pane display="flex" gap={minorScale(1)} flexWrap="wrap">
              {location.dietaryOptions.map((option) => (
                <Badge key={option} color="neutral">
                  {option}
                </Badge>
              ))}
            </Pane>
          </Pane>
        ))}
      </Pane>
    </Pane>
  );

  let Profile;
  if (isLoading) Profile = <Spinner />;
  else if (error) Profile = <div>{error.message}</div>;
  else if (user) {
    Profile = (
      <Pane width="100%">
        <Pane display="flex" justifyContent="space-between" marginBottom={majorScale(3)}>
          <Button height={40} iconBefore={FilterIcon} appearance="minimal">
            Filters
          </Button>
        </Pane>
        <MainContent />
      </Pane>
    );
  } else {
    Profile = <AuthButton />;
  }

  return (
    <Pane
      display="flex"
      justifyContent="center"
      alignItems="center"
      marginX={majorScale(1)}
      paddingBottom={majorScale(4)}
      paddingTop={majorScale(8)}
    >
      <Pane
        borderRadius={8}
        elevation={1}
        background="white"
        marginX={20}
        maxWidth="800px"
        width="100%"
        paddingX={majorScale(3)}
        paddingY={majorScale(4)}
      >
        <Heading size={900} className="hoagie" textAlign="center" marginBottom={majorScale(2)}>
          Hoagie Meal
        </Heading>

        <Pane display="flex" flexDirection="column" alignItems="center">
          {Profile}
        </Pane>
      </Pane>
    </Pane>
  );
}
