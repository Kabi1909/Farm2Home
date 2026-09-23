export const districts = [
  'Ampara',
  'Anuradhapura',
  'Badulla',
  'Batticaloa',
  'Colombo',
  'Galle',
  'Gampaha',
  'Hambantota',
  'Jaffna',
  'Kalutara',
  'Kandy',
  'Kegalle',
  'Kilinochchi',
  'Kurunegala',
  'Mannar',
  'Matale',
  'Matara',
  'Monaragala',
  'Mullaitivu',
  'Nuwara Eliya',
  'Polonnaruwa',
  'Puttalam',
  'Ratnapura',
  'Trincomalee',
  'Vavuniya',
];
export const towns = Object.fromEntries(districts.map((d) => [d, [d]]));
Object.assign(towns, {
  Vavuniya: ['Vavuniya', 'Omanthai', 'Nedunkeni'],
  Jaffna: ['Jaffna', 'Chavakachcheri', 'Point Pedro'],
  Anuradhapura: ['Anuradhapura', 'Kekirawa', 'Mihintale'],
  Matale: ['Dambulla', 'Matale', 'Sigiriya'],
  Kandy: ['Kandy', 'Peradeniya', 'Gampola'],
  'Nuwara Eliya': ['Nuwara Eliya', 'Hatton', 'Talawakelle'],
  Colombo: ['Colombo', 'Dehiwala', 'Nugegoda'],
  Galle: ['Galle', 'Hikkaduwa', 'Elpitiya'],
  Matara: ['Matara', 'Weligama', 'Akuressa'],
  Kurunegala: ['Kurunegala', 'Kuliyapitiya', 'Pannala'],
  Batticaloa: ['Batticaloa', 'Eravur', 'Kattankudy'],
});
export const categories = [
  'Vegetables',
  'Fruits',
  'Rice & Grains',
  'Spices',
  'Coconut Products',
  'Leafy Greens',
  'Pulses',
  'Herbs',
  'Seeds',
  'Organic Products',
  'Dairy',
  'Other Farm Products',
];
export const methods = ['Conventional', 'Organic', 'Natural', 'Hydroponic', 'Other'];
export const qualities = ['Premium', 'Grade A', 'Grade B', 'Standard'];
export const statuses = ['Available', 'Low Stock', 'Upcoming Harvest', 'Sold Out'];
export const photo = (id, width = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;
export const images = {
  tomato: photo('photo-1546094096-0df4bcaaa337'),
  carrot: photo('photo-1445282768818-728615cc910a'),
  potato: photo('photo-1518977676601-b53f82aba655'),
  onion: photo('photo-1508747703725-719777637510'),
  brinjal: photo('photo-1659261200833-ec9b3fb88baf'),
  beans: photo('photo-1567375698348-5d9d5ae99de0'),
  cabbage: photo('photo-1594282486552-05b4d80fbb9f'),
  pumpkin: photo('photo-1506917728037-b6af01a7d403'),
  banana: photo('photo-1571771894821-ce9b6c11b08e'),
  mango: photo('photo-1553279768-865429fa0078'),
  papaya: photo('photo-1517282009859-f000ec3b26fe'),
  pineapple: photo('photo-1550258987-190a2d41a8ba'),
  rice: photo('photo-1586201375761-83865001e31c'),
  coconut: photo('photo-1580984969071-a8da5656c2fb'),
  spices: photo('photo-1596040033229-a9821ebd058d'),
  greens: photo('photo-1540420773420-3366772f4999'),
  farm: photo('photo-1500382017468-9049fed747ef', 1600),
  hero: photo('photo-1542838132-92c53300491e', 1600),
};
export const orderSteps = (fulfillment) =>
  fulfillment === 'pickup'
    ? ['Pending', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Completed']
    : ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Completed'];
