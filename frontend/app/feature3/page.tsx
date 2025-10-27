'use client';

import React from 'react';

// --- Helper Components & Data ---

// Icon for social media links
const SocialIcon = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a
    href={href}
    target='_blank'
    rel='noopener noreferrer'
    className='text-gray-400 hover:text-emerald-500 transition-colors duration-300'
  >
    {children}
  </a>
);

// SVG components for icons
const LinkedinIcon = () => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    width='24'
    height='24'
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

const TwitterIcon = () => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    width='24'
    height='24'
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

// Team data organized for easier management
const teamLeads = [
  {
    name: 'Kevin Liu',
    role: 'Team Lead',
    bio: 'Kevin is a full-stack developer with a passion for building scalable web applications. He leads the development team with a focus on performance and user experience.',
    imgSrc:
      'https://media.licdn.com/dms/image/v2/D4E03AQHg-qMcpe8Y5A/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1716047912115?e=1761782400&v=beta&t=agaXimH6QORdejq_ekzfFk4kpx7OjFN-hCPd_zqlUHM',
    socials: {
      linkedin: 'https://www.linkedin.com/in/kevin-liu-princeton/',
    },
  },
  {
    name: 'Abu Ahmed',
    role: 'Team Lead',
    bio: 'Abu is a seasoned software engineer specializing in backend development and cloud infrastructure. He ensures our systems are robust and reliable.',
    imgSrc:
      'https://media.licdn.com/dms/image/v2/D4E03AQGq-NtaaCd-0w/profile-displayphoto-crop_800_800/B4EZlkdNZbIkAI-/0/1758327003647?e=1761782400&v=beta&t=sx5HjnS2C9TSbPml4jkE6UmMhdccwUcYMb056yawx0A',
    socials: {
      linkedin: 'https://www.linkedin.com/in/abuahmed0821/',
    },
  },
];

const teamMembers = [
  // Add your name, role, and image here!
  {
    name: 'Angela Cai',
    role: 'Developer',
    imgSrc: 'https://placehold.co/100x100/d1fae5/059669?text=AC',
    socials: {
      linkedin: 'https://www.linkedin.com/in/angcai/',
    },
  },
  {
    name: 'Caleb Kha-Uong',
    role: 'Fullstack Developer',
    imgSrc: 
    'https://media.licdn.com/dms/image/v2/D5603AQHtWsVjQbCx-g/profile-displayphoto-crop_800_800/B56ZhC4LH1HUAI-/0/1753468679847?e=1762387200&v=beta&t=UgCV9uFTuzPp9ZpzV1cqTls41yTc4Nb14rTzy3HVj5g',
    socials: {
      linkedin: 'https://www.linkedin.com/in/calebK25/',
      website: 'https://caleb-k.com',
    },
  },
];

/**
 * Modern "Meet the Team" page component.
 * Features a clean, professional design with interactive cards.
 */
export default function App() {
  return (
    <div className='min-h-screen font-sans text-slate-800'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-16'>
        {/* Header */}
        <header className='text-center mb-12'>
          <h1 className='text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight'>
            Meet the <span className='text-emerald-600'>HoagieMeal</span> Team
          </h1>
          <p className='mt-4 text-lg text-slate-600 max-w-2xl mx-auto'>
            We&apos;re a passionate group of foodies, developers, and designers dedicated to making
            your dining experience easier and more enjoyable.
          </p>
        </header>

        {/* Team Leadership Section */}
        <section className='mb-16'>
          <h2 className='text-3xl font-bold text-slate-900 mb-12 text-center'>Team Leadership</h2>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-5xl mx-auto'>
            {teamLeads.map((lead) => (
              <div
                key={lead.name}
                className='bg-white rounded-2xl shadow-lg overflow-hidden transform hover:scale-[1.02] transition-transform duration-300 ease-in-out'
              >
                <div className='p-8 flex flex-col sm:flex-row items-center'>
                  <img
                    src={lead.imgSrc}
                    alt={lead.name}
                    className='w-32 h-32 rounded-full mb-6 sm:mb-0 sm:mr-8 flex-shrink-0 border-4 border-emerald-200 shadow-md'
                  />
                  <div className='text-center sm:text-left'>
                    <h3 className='text-2xl font-bold text-slate-900'>{lead.name}</h3>
                    <p className='text-md font-semibold text-emerald-600 mb-2'>{lead.role}</p>
                    <p className='text-slate-600 mb-4'>{lead.bio}</p>
                    <div className='flex justify-center sm:justify-start space-x-4'>
                      <SocialIcon href={lead.socials.linkedin}>
                        <LinkedinIcon />
                      </SocialIcon>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Team Members Section */}
        <section>
          <h2 className='text-3xl font-bold text-slate-900 mb-12 text-center'>Our Amazing Team</h2>
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8'>
            {teamMembers.map((member) => (
              <div
                key={member.name}
                className='bg-white rounded-xl shadow-md p-6 text-center transform hover:-translate-y-2 transition-transform duration-300 ease-in-out group'
              >
                <img
                  src={member.imgSrc}
                  alt={member.name}
                  className='w-24 h-24 rounded-full mx-auto mb-4 border-4 border-slate-200 group-hover:border-emerald-300 transition-colors duration-300'
                />
                <h4 className='font-bold text-slate-800 text-lg'>{member.name}</h4>
                <p className='text-emerald-600 text-sm'>{member.role}</p>
                <div className='flex mx-auto w-min mt-2 justify-center sm:justify-start space-x-4'>
                  <SocialIcon href={member.socials.linkedin}>
                    <LinkedinIcon />
                  </SocialIcon>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
