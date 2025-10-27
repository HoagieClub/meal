'use client';

import React, { useState, useEffect } from 'react'; // IMPORTED useState, useEffect
import {
  Pane,
  Heading,
  Paragraph,
  Text,
  Card,
  Avatar,
  IconButton,
  majorScale,
  minorScale,
  useTheme,
  PeopleIcon,
  PersonIcon,
} from 'evergreen-ui';

// --- NEW HELPER HOOK ---
// A simple hook to check if the screen is mobile-sized.
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Set the initial value on mount (client-side only)
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query);
      if (media.matches !== matches) {
        setMatches(media.matches);
      }
      const listener = () => setMatches(media.matches);
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [matches, query]);

  return matches;
}
// --- END HELPER HOOK ---

// --- SVG Icon Components ---
// We will pass these directly to Evergreen's IconButton `icon` prop.
const LinkedinIcon = (props) => (
  <svg
    {...props}
    width='20'
    height='20'
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z'></path>
    <rect x='2' y='9' width='4' height='12'></rect>
    <circle cx='4' cy='4' r='2'></circle>
  </svg>
);

const TwitterIcon = (props) => (
  <svg
    {...props}
    width='20'
    height='20'
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z'></path>
  </svg>
);

const GithubIcon = (props) => (
  <svg
    {...props}
    width='20'
    height='20'
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22'></path>
  </svg>
);

const WebsiteIcon = (props) => (
  <svg
    {...props}
    width='20'
    height='20'
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <circle cx='12' cy='12' r='10'></circle>
    <line x1='2' y1='12' x2='22' y2='12'></line>
    <path d='M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'></path>
  </svg>
);

// --- Social Icon Helper ---
const SocialIconButton = ({ href, label, icon, background }) => (
  <IconButton
    is='a'
    href={href}
    target='_blank'
    rel='noopener noreferrer'
    aria-label={label}
    icon={icon}
    appearance='minimal'
    background={background || 'transparent'}
  />
);

// --- Team Data (Unchanged) ---
const teamLeads = [
  {
    name: 'Kevin Liu',
    role: 'Team Lead & Full-Stack Developer',
    bio: 'Kevin leads the development team with a passion for building scalable, user-centric web applications and a focus on performance.',
    imgSrc:
      'https://media.licdn.com/dms/image/v2/D4E03AQHg-qMcpe8Y5A/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1716047912115?e=1761782400&v=beta&t=agaXimH6QORdejq_ekzfFk4kpx7OjFN-hCPd_zqlUHM',
    socials: {
      linkedin: 'https://www.linkedin.com/in/kevin-liu-princeton/',
      github: 'https://github.com/kevin-liu-01',
      website: 'https://kevin-liu.tech',
    },
  },
  {
    name: 'Abu Ahmed',
    role: 'Team Lead & Backend Specialist',
    bio: 'Abu is a seasoned software engineer specializing in backend development and cloud infrastructure, ensuring our systems are robust and reliable.',
    imgSrc:
      'https://media.licdn.com/dms/image/v2/D4E03AQGq-NtaaCd-0w/profile-displayphoto-crop_800_800/B4EZlkdNZbIkAI-/0/1758327003647?e=1761782400&v=beta&t=sx5HjnS2C9TSbPml4jkE6UmMhdccwUcYMb056yawx0A',
    socials: {
      linkedin: 'https://www.linkedin.com/in/abuahmed0821/',
      github: 'https://github.com/abuahmed0821',
    },
  },
];

const teamMembers = [
  {
    name: 'Malachi Noel',
    role: 'Contributor',
    imgSrc: 'https://i.imgur.com/MPwu9Nc.jpeg',
    socials: {
      linkedin: 'https://www.linkedin.com/in/malachi-noel/',
    },
  },
  {
    name: 'Santiago Criado',
    role: 'Contributor',
    imgSrc: 'https://placehold.co/100x100/d1fae5/059669?text=SC',
    socials: {
      linkedin: 'https://www.linkedin.com/in/santiago-criado-91b87a31b/',
    },
  },
  {
    name: 'Caleb Kha-Uong',
    role: 'Contributor',
    imgSrc:
      'https://media.licdn.com/dms/image/v2/D5603AQHtWsVjQbCx-g/profile-displayphoto-crop_800_800/B56ZhC4LH1HUAI-/0/1753468679847?e=1762387200&v=beta&t=UgCV9uFTuzPp9ZpzV1cqTls41yTc4Nb14rTzy3HVj5g',
    socials: {
      linkedin: 'https://www.linkedin.com/in/calebK25/',
      website: 'https://caleb-k.com',
    },
  },
  {
    name: 'Yusuf Abdul',
    role: 'Contributor',
    imgSrc: 'https://placehold.co/100x100/d1fae5/059669?text=YA',
    socials: {
      linkedin: 'https://www.linkedin.com/in/yusuf-abdelnur/',
    },
  },
  {
    name: 'Emily Zou',
    role: 'Contributor',
    imgSrc:
      'https://media.licdn.com/dms/image/v2/D4E03AQGRoLN7sINVZw/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1721419898121?e=2147483647&v=beta&t=5YOXJjyWo2vSQ8IS3fnLClfiDZzGEWTqzoUJrkCduwk',
    socials: {
      linkedin: 'https://www.linkedin.com/in/emily-zou-princeton/',
    },
  },
  {
    name: 'Zashaan Shaik',
    role: 'Contributor',
    imgSrc: 'https://placehold.co/100x100/d1fae5/059669?text=ZS',
    socials: {
      linkedin: 'https://www.linkedin.com/in/zashaan-shaik/',
    },
  },
  {
    name: 'Faylinn Wong',
    role: 'Contributor',
    imgSrc: 'https://placehold.co/100x100/d1fae5/059669?text=FW',
    socials: {
      linkedin: 'https://www.linkedin.com/in/faylinn-w-005890238/',
    },
  },
  {
    name: 'Brooke Xu',
    role: 'Contributor',
    imgSrc: 'https://placehold.co/100x100/d1fae5/059669?text=BX',
    socials: {
      linkedin: 'https://www.linkedin.com/in/brooke-xu/',
    },
  },
  {
    name: 'Andrew Xia',
    role: 'Contributor',
    imgSrc: 'https://i.imgur.com/53PYPL3.jpeg',
    socials: {
      linkedin: 'https://www.linkedin.com/in/andrew-y-xia/',
    },
  },
  {
    name: 'Mathias Nguyen-Van-Duong',
    role: 'Contributor',
    imgSrc: 'https://placehold.co/100x100/d1fae5/059669?text=MN',
    socials: {
      linkedin: 'https://www.linkedin.com/in/mathiasnvd',
    },
  },
];

/**
 * "Meet the Team" page component using Evergreen UI.
 */
export default function App() {
  const theme = useTheme();
  // --- NEW: Media query for responsive layouts ---
  const isMobile = useMediaQuery('(max-width: 768px)');

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
                    {lead.socials.linkedin && (
                      <SocialIconButton
                        href={lead.socials.linkedin}
                        label={`${lead.name}'s LinkedIn`}
                        icon={LinkedinIcon}
                        background={theme.colors.gray100}
                      />
                    )}
                    {lead.socials.github && (
                      <SocialIconButton
                        href={lead.socials.github}
                        label={`${lead.name}'s GitHub`}
                        icon={GithubIcon}
                        background={theme.colors.gray100}
                      />
                    )}
                    {lead.socials.website && (
                      <SocialIconButton
                        href={lead.socials.website}
                        label={`${lead.name}'s Website`}
                        icon={WebsiteIcon}
                        background={theme.colors.gray100}
                      />
                    )}
                    {lead.socials.twitter && (
                      <SocialIconButton
                        href={lead.socials.twitter}
                        label={`${lead.name}'s Twitter`}
                        icon={TwitterIcon}
                        background={theme.colors.gray100}
                      />
                    )}
                  </Pane>
                </Pane>
              </Card>
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
                  {member.socials.linkedin && (
                    <SocialIconButton
                      href={member.socials.linkedin}
                      label={`${member.name}'s LinkedIn`}
                      icon={LinkedinIcon}
                      background={theme.colors.gray100}
                    />
                  )}
                  {member.socials.github && (
                    <SocialIconButton
                      href={member.socials.github}
                      label={`${member.name}'s GitHub`}
                      icon={GithubIcon}
                      background={theme.colors.gray100}
                    />
                  )}
                  {member.socials.website && (
                    <SocialIconButton
                      href={member.socials.website}
                      label={`${member.name}'s Website`}
                      icon={WebsiteIcon}
                      background={theme.colors.gray100}
                    />
                  )}
                  {member.socials.twitter && (
                    <SocialIconButton
                      href={member.socials.twitter}
                      label={`${member.name}'s Twitter`}
                      icon={TwitterIcon}
                      background={theme.colors.gray1s00}
                    />
                  )}
                </Pane>
              </Card>
            ))}
          </Pane>
        </Pane>
      </Pane>
    </Pane>
  );
}
