/**
 * @overview Data for the About page.
 *
 * Copyright © 2021-2025 Hoagie Club and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree or at https://github.com/hoagieclub/meal/LICENSE.
 *
 * Permission is granted under the MIT License to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.
 */

import { TeamMember } from '@/types/team';
import { LinkedinIcon, GithubIcon, WebsiteIcon, TwitterIcon } from '@/app/about/components/icons';

// Team leads data.
export const TEAM_LEADS: TeamMember[] = [
  {
    name: 'Kevin Liu',
    role: 'Team Lead & Full-Stack Developer',
    bio: 'Kevin leads the development team with a passion for building scalable, user-centric web applications and a focus on performance.',
    imgSrc:
      'https://media.licdn.com/dms/image/v2/D4E03AQHg-qMcpe8Y5A/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1716047912115?e=1763596800&v=beta&t=9jwc8YiQZjmtEuWDhbN2rTNH3SACxbskTESJgbftDWI',
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
      'https://media.licdn.com/dms/image/v2/D4E03AQGq-NtaaCd-0w/profile-displayphoto-scale_100_100/B4EZlkdNZbIkAc-/0/1758327003738?e=1763596800&v=beta&t=yVnsxkAgdCFHKRFCV-q6OI4_ECn_-6IOX9V4IOwCXuw',
    socials: {
      linkedin: 'https://www.linkedin.com/in/abuahmed0821/',
      github: 'https://github.com/abuahmed0821',
    },
  },
];

// Team members data.
export const TEAM_MEMBERS: TeamMember[] = [
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

// Social icons data.
export const SOCIAL_ICONS = {
  linkedin: { icon: LinkedinIcon, label: 'LinkedIn' },
  github: { icon: GithubIcon, label: 'GitHub' },
  website: { icon: WebsiteIcon, label: 'Website' },
  twitter: { icon: TwitterIcon, label: 'Twitter' },
};
