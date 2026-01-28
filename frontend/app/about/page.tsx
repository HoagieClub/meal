/**
 * @overview About page for the Hoagie Meal app.
 * @description This page displays information about the Hoagie Meal app team.
 * Copyright © 2021-2025 Hoagie Club and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree or at https://github.com/hoagieclub/meal/LICENSE.
 *
 * Permission is granted under the MIT License to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.
 */

'use client';

import React, { useEffect, useState } from 'react';
import {
  Pane,
  Heading,
  Paragraph,
  majorScale,
  minorScale,
  useTheme,
  PeopleIcon,
  PersonIcon,
  Spinner,
} from 'evergreen-ui';
import { useMediaQuery } from '@/hooks/use-media-query';
import { TEAM_LEADS, TEAM_MEMBERS } from './data';
import TeamLeadCard from './components/team-lead-card';
import TeamMemberCard from './components/team-member-card';

/**
 * About page component. Displays the team leads and team members.
 *
 * @returns The about page component.
 */
export default function About() {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isMounted, setIsMounted] = useState(false);

  // Return spinner until the component is mounted
  useEffect(() => {
    setIsMounted(true);
  }, []);
  if (!isMounted) {
    return <Spinner />;
  }

  // Define the grid template columns for the team leads and team members
  const gridTemplateColumns = isMobile ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))';
  const gridTemplateColumnsMembers = isMobile
    ? 'repeat(auto-fill, minmax(150px, 1fr))'
    : 'repeat(auto-fit, minmax(200px, 1fr))';
  const paddingX = isMobile ? majorScale(2) : majorScale(4);
  const paddingY = isMobile ? majorScale(4) : majorScale(6);

  // Render the about page
  return (
    <Pane minHeight='100vh'>
      <Pane maxWidth={1200} marginX='auto' paddingX={paddingX} paddingY={paddingY}>
        <Pane is='header' textAlign='center' marginBottom={majorScale(6)}>
          <Heading
            is='h1'
            size={isMobile ? 800 : 900}
            fontWeight={900}
            marginBottom={majorScale(1)}
          >
            Meet the{' '}
            <Heading
              is='span'
              size={isMobile ? 800 : 900}
              fontWeight={900}
              color={theme.colors.green700}
            >
              HoagieMeal
            </Heading>{' '}
            Team
          </Heading>
          <Paragraph
            size={400}
            maxWidth={majorScale(70)}
            marginX='auto'
            color={theme.colors.green800}
          >
            We&apos;re a passionate group of foodies, developers, and designers dedicated to making
            your dining experience easier and more enjoyable.
          </Paragraph>
        </Pane>

        {/* Render the team leads */}
        <Pane is='section' marginBottom={majorScale(6)}>
          <Heading
            is='h2'
            size={700}
            marginBottom={majorScale(3)}
            display='flex'
            alignItems='center'
          >
            <PeopleIcon marginRight={minorScale(2)} color={theme.colors.green700} />
            Team Leads
          </Heading>
          <Pane display='grid' gridTemplateColumns={gridTemplateColumns} gap={majorScale(3)}>
            {TEAM_LEADS.map((lead) => (
              <TeamLeadCard key={lead.name} lead={lead} />
            ))}
          </Pane>
        </Pane>

        {/* Render the team members */}
        <Pane is='section' marginBottom={majorScale(6)}>
          <Heading
            is='h2'
            size={700}
            marginBottom={majorScale(3)}
            display='flex'
            alignItems='center'
          >
            <PersonIcon marginRight={minorScale(2)} color={theme.colors.green700} />
            Our Amazing Team
          </Heading>
          <Pane display='grid' gridTemplateColumns={gridTemplateColumnsMembers} gap={majorScale(3)}>
            {TEAM_MEMBERS.map((member) => (
              <TeamMemberCard key={member.name} member={member} />
            ))}
          </Pane>
        </Pane>
      </Pane>
    </Pane>
  );
}
