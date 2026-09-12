import type { StaticImageData } from 'next/image';
import chemistryBanner from '@/public/images/banners/Chemistry-CaFe.png';
import cjlBanner from '@/public/images/banners/cjl-banner.png';
import equadBanner from '@/public/images/banners/EQuad-Cafe.png';
import forbesBanner from '@/public/images/banners/forbesbanner.png';
import fristBanner from '@/public/images/banners/Frist-Pic.png';
import genomicsBanner from '@/public/images/banners/Genomics-Cafe.png';
import gradBanner from '@/public/images/banners/gradbanner.png';
import rockyBanner from '@/public/images/banners/rockybanner.png';
import shultzBanner from '@/public/images/banners/Shultz-Cafe.png';
import whitmanButlerBanner from '@/public/images/banners/whitmanbutlerbanner.png';
import yehBanner from '@/public/images/banners/yehbanner.png';
import type { DiningHall } from '@/lib/constants';

/**
 * Card banner image for each dining hall. These are Next.js static image imports, which only the
 * bundler understands, so they live apart from the plain data in constants.ts that tests and
 * scripts import under Node.
 */
export const DINING_HALL_BANNERS: Record<DiningHall, StaticImageData> = {
  'Forbes College': forbesBanner,
  'Mathey & Rockefeller Colleges': rockyBanner,
  'Whitman & Butler Colleges': whitmanButlerBanner,
  'Yeh & Huo Colleges': yehBanner,
  'Center for Jewish Life': cjlBanner,
  'Graduate College': gradBanner,
  'Chemistry CaFe': chemistryBanner,
  'EQuad Cafe': equadBanner,
  'Frist Gallery': fristBanner,
  'Genomics Cafe': genomicsBanner,
  'Shultz Cafe': shultzBanner,
};
