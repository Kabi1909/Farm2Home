import { images, photo } from './catalog';
export const farmHero = '/images/farm-hero.png';
export const categoryArt = {
  Vegetables: { image: images.hero, symbol: '🥕' },
  Fruits: { image: images.mango, symbol: '🥭' },
  'Rice & Grains': { image: images.rice, symbol: '🌾' },
  Spices: { image: images.spices, symbol: '🌶️' },
  'Coconut Products': { image: images.coconut, symbol: '🥥' },
  'Leafy Greens': { image: images.greens, symbol: '🥬' },
  Pulses: { image: photo('photo-1515543904379-3d757afe72e4'), symbol: '🫘' },
  Herbs: { image: images.greens, symbol: '🌿' },
  Seeds: { image: images.rice, symbol: '🌱' },
  'Organic Products': { image: photo('photo-1416879595882-3373a0480b5b'), symbol: '🌱' },
  Dairy: { image: photo('photo-1563636619-e9143da7973b'), symbol: '🥛' },
  'Other Farm Products': { image: images.hero, symbol: '🌿' },
};
