/**
 * @overview Team member card component for the About page.
 *
 * Copyright © 2021-2025 Hoagie Club and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree or at https://github.com/hoagieclub/meal/LICENSE.
 *
 * Permission is granted under the MIT License to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.
 */

import { Card, Avatar, Heading, Text, Pane, majorScale, minorScale, useTheme } from 'evergreen-ui';
import { SocialIconButton } from '@/app/about/components/icons';
import { TeamMember } from '@/types/team';
import { SOCIAL_ICONS } from '../data';

export default function TeamMemberCard({ member }: { member: TeamMember }) {
  const theme = useTheme();
  return (
    <Card
      key={member.name}
      elevation={1}
      hoverElevation={2}
      transition='box-shadow 0.3s ease-in-out'
      padding={majorScale(3)}
      textAlign='center'
      background={theme.colors.green200}
      borderRadius={12}
    >
      <Avatar
        src={member.imgSrc}
        name={member.name}
        size={majorScale(10)}
        marginX='auto'
        marginBottom={majorScale(2)}
      />
      <Heading size={400} marginBottom={minorScale(1)} className='truncate'>
        {member.name}
      </Heading>
      <Text size={300} color='muted' display='block' marginBottom={majorScale(1)}>
        {member.role}
      </Text>

      <Pane display='flex' justifyContent='center' gap={minorScale(2)}>
        {Object.entries(member.socials).map(([key, url]) => {
          if (!url) return null;
          const social = SOCIAL_ICONS[key as keyof typeof SOCIAL_ICONS];
          if (!social) return null;
          return (
            <SocialIconButton
              key={key}
              href={url}
              label={`${member.name}'s ${social.label}`}
              icon={social.icon}
              background={theme.colors.gray100}
            />
          );
        })}
      </Pane>
    </Card>
  );
}
