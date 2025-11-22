export interface TeamMember {
  name: string;
  role: string;
  bio?: string;
  imgSrc: string;
  socials: {
    linkedin?: string;
    github?: string;
    website?: string;
    twitter?: string;
  };
}
