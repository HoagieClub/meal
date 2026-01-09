/**
 * @overview Team lead card component for the About page.
 *
 * Copyright © 2021-2025 Hoagie Club and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree or at https://github.com/hoagieclub/meal/LICENSE.
 *
 * Permission is granted under the MIT License to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.
 */

import {
  Card,
  majorScale,
  Pane,
  Heading,
  Text,
  Avatar,
  useTheme,
  Paragraph,
  minorScale,
} from 'evergreen-ui';
import { useMediaQuery } from '@/hooks/use-media-query';
import { SocialIconButton } from '@/app/about/components/icons';
import { TeamMember } from '@/types/types';
import { SOCIAL_ICONS } from '../data';

/**
 * Team lead card component.
 *
 * @param lead - The team lead to display.
 * @returns The team lead card component.
 */
export default function TeamLeadCard({ lead }: { lead: TeamMember }) {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <Card
      key={lead.name}
      elevation={2}
      hoverElevation={3}
      transition='box-shadow 0.3s ease-in-out'
      padding={majorScale(3)}
      display='flex'
      flexDirection={isMobile ? 'column' : 'row'}
      alignItems={isMobile ? 'center' : 'center'}
      background={theme.colors.green100}
      borderRadius={12}
    >   
      {/* Render the lead avatar */}
      <Avatar
        src={lead.imgSrc}
        name={lead.name}
        size={majorScale(12)}
        marginBottom={isMobile ? majorScale(2) : 0}
      />

      {/* Render the lead name, role, and bio */}
      <Pane marginLeft={isMobile ? 0 : majorScale(3)} textAlign={isMobile ? 'center' : 'left'}>
        <Heading size={500}>{lead.name}</Heading>
        <Text size={400} color='muted' fontStyle='italic'>
          {lead.role}
        </Text>
        <Paragraph size={300} color='default' marginTop={majorScale(1)}>
          {lead.bio}
        </Paragraph>

        {/* Render the social icons */}
        <Pane
          display='flex'
          gap={minorScale(2)}
          marginTop={majorScale(2)}
          justifyContent={isMobile ? 'center' : 'flex-start'}
        >
          {/* Render the social icons */}
          {Object.entries(lead.socials).map(([key, url]) => {
            if (!url) return null;
            const social = SOCIAL_ICONS[key as keyof typeof SOCIAL_ICONS];
            if (!social) return null;
            return (
              <SocialIconButton
                href={url}
                label={`${lead.name}'s ${social.label}`}
                icon={social.icon}
                background={theme.colors.gray100}
              />
            );
          })}
        </Pane>
      </Pane>
    </Card>
  );
}
