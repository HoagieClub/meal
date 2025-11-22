import { Card, Avatar, Heading, Text, Pane, majorScale, minorScale, useTheme } from 'evergreen-ui';
import {
  SocialIconButton,
  LinkedinIcon,
  GithubIcon,
  WebsiteIcon,
  TwitterIcon,
} from '@/app/about/components/icons';
import { TeamMember } from '@/types/team';

const SOCIAL_ICONS = {
  linkedin: { icon: LinkedinIcon, label: 'LinkedIn' },
  github: { icon: GithubIcon, label: 'GitHub' },
  website: { icon: WebsiteIcon, label: 'Website' },
  twitter: { icon: TwitterIcon, label: 'Twitter' },
};

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
          const { icon, label } = SOCIAL_ICONS[key as keyof typeof SOCIAL_ICONS] || {
            icon: null,
            label: '',
          };
          return (
            <SocialIconButton
              key={key}
              href={url}
              label={`${member.name}'s ${label}`}
              icon={icon}
              background={theme.colors.gray100}
            />
          );
        })}
      </Pane>
    </Card>
  );
}
