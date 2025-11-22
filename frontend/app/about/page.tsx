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
import useMediaQuery from '@/hooks/use-media-query';
import { teamLeads, teamMembers } from './team';
import TeamLeadCard from './components/TeamLeadCard';
import TeamMemberCard from './components/TeamMemberCard';

export default function About() {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) {
    return <Spinner />;
  }

  return (
    <Pane minHeight='100vh'>
      <Pane
        maxWidth={1200}
        marginX='auto'
        // --- UPDATED: Responsive padding ---
        padding={isMobile ? majorScale(2) : majorScale(4)}
        paddingY={isMobile ? majorScale(4) : majorScale(6)}
      >
        {/* Header */}
        <Pane is='header' textAlign='center' marginBottom={majorScale(6)}>
          <Heading
            is='h1'
            // --- UPDATED: Responsive size ---
            size={isMobile ? 800 : 900}
            fontWeight={900}
            marginBottom={majorScale(1)}
          >
            Meet the{' '}
            <Heading
              is='span'
              // --- UPDATED: Responsive size ---
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

        {/* Team Leadership Section */}
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
          <Pane
            display='grid'
            // --- UPDATED: Responsive grid columns ---
            gridTemplateColumns={isMobile ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))'}
            gap={majorScale(3)}
          >
            {teamLeads.map((lead) => (
              <TeamLeadCard key={lead.name} lead={lead} />
            ))}
          </Pane>
        </Pane>

        {/* Team Members Section */}
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
          <Pane
            display='grid'
            // --- UPDATED: Responsive grid columns ---
            // Using 'auto-fill' and 150px min allows 2 columns on most phones
            gridTemplateColumns={
              isMobile
                ? 'repeat(auto-fill, minmax(150px, 1fr))'
                : 'repeat(auto-fit, minmax(200px, 1fr))'
            }
            gap={majorScale(3)}
          >
            {teamMembers.map((member) => (
              <TeamMemberCard key={member.name} member={member} />
            ))}
          </Pane>
        </Pane>
      </Pane>
    </Pane>
  );
}
