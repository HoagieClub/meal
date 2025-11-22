import { TeamMember } from '@/types/team';
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
import useMediaQuery from '@/hooks/use-media-query';
import {
  SocialIconButton,
  LinkedinIcon,
  GithubIcon,
  WebsiteIcon,
  TwitterIcon,
} from '@/app/about/components/icons';

const SOCIAL_ICONS = {
  linkedin: { icon: LinkedinIcon, label: 'LinkedIn' },
  github: { icon: GithubIcon, label: 'GitHub' },
  website: { icon: WebsiteIcon, label: 'Website' },
  twitter: { icon: TwitterIcon, label: 'Twitter' },
};

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
      // --- UPDATED: Responsive layout ---
      flexDirection={isMobile ? 'column' : 'row'}
      alignItems={isMobile ? 'center' : 'center'} // 'center' works for both
      background={theme.colors.green100}
      borderRadius={12}
    >
      <Avatar
        src={lead.imgSrc}
        name={lead.name}
        size={majorScale(12)}
        // --- UPDATED: Responsive margin ---
        marginBottom={isMobile ? majorScale(2) : 0}
      />
      <Pane
        // --- UPDATED: Responsive layout ---
        marginLeft={isMobile ? 0 : majorScale(3)}
        textAlign={isMobile ? 'center' : 'left'}
      >
        <Heading size={500}>{lead.name}</Heading>
        <Text size={400} color='muted' fontStyle='italic'>
          {lead.role}
        </Text>
        <Paragraph size={300} color='default' marginTop={majorScale(1)}>
          {lead.bio}
        </Paragraph>
        <Pane
          display='flex'
          gap={minorScale(2)}
          marginTop={majorScale(2)}
          // --- UPDATED: Responsive layout ---
          justifyContent={isMobile ? 'center' : 'flex-start'}
        >
          {Object.entries(lead.socials).map(([key, url]) => {
            if (!url) return null;
            const { icon, label } = SOCIAL_ICONS[key as keyof typeof SOCIAL_ICONS] || {
              icon: null,
              label: '',
            };
            return (
              <SocialIconButton
                href={url}
                label={`${lead.name}'s ${label}`}
                icon={icon}
                background={theme.colors.gray100}
              />
            );
          })}
        </Pane>
      </Pane>
    </Card>
  );
}
