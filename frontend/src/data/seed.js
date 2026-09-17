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
const farmerNames = [
  'Sunil Perera',
  'Kumari Bandara',
  'Sivakumar Rajan',
  'Nimal Jayasinghe',
  'Dilani Fernando',
  'Ruwan Dissanayake',
  'Fathima Rizna',
  'Saman Kumara',
  'Lakshmi Wijesinghe',
  'Tharanga Silva',
];
const locations = [
  'Vavuniya',
  'Nuwara Eliya',
  'Jaffna',
  'Anuradhapura',
  'Galle',
  'Matale',
  'Batticaloa',
  'Kurunegala',
  'Kandy',
  'Matara',
];
export const farmers = farmerNames.map((name, i) => ({
  id: `f${i + 1}`,
  name,
  email: i === 0 ? 'farmer@farm2home.lk' : `farmer${i + 1}@farm2home.lk`,
  role: 'farmer',
  phone: '0771234567',
  farm: [
    'Sunrise Family Farm',
    'Hill Country Harvest',
    'Northern Roots Farm',
    'Golden Fields',
    'Green Valley Organics',
    'Dambulla Fresh',
    'Eastern Harvest',
    'Coconut Grove',
    'Kandy Hills Farm',
    'Southern Soil',
  ][i],
  district: locations[i],
  city: towns[locations[i]][0],
  crops: ['Vegetables', 'Fruits', 'Rice & Grains'][i % 3],
  method: methods[i % 3],
  size: 3 + i,
  experience: 8 + i,
  rating: 4.6 + (i % 4) / 10,
  completed: 120 + i * 23,
  delivery: true,
  pickup: true,
  description:
    'A family-run Sri Lankan farm growing fresh seasonal produce with care for our community and the land.',
  image: `https://i.pravatar.cc/300?img=${[12, 47, 11, 53, 44, 13, 49, 60, 45, 59][i]}`,
  lat: [8.75, 6.97, 9.66, 8.31, 6.05, 7.86, 7.71, 7.48, 7.29, 5.95][i],
  lng: [80.5, 80.78, 80.02, 80.4, 80.22, 80.65, 81.69, 80.36, 80.63, 80.55][i],
}));
export const customers = Array.from({ length: 20 }, (_, i) => ({
  id: `c${i + 1}`,
  name:
    ['Amaya', 'Kasun', 'Nethmi', 'Dinesh', 'Shanika'][i % 5] +
    ' ' +
    ['Perera', 'Silva', 'Fernando', 'Bandara'][i % 4],
  email: i === 0 ? 'customer@farm2home.lk' : `customer${i + 1}@farm2home.lk`,
  role: 'customer',
  phone: '0779876543',
  district: 'Colombo',
  city: 'Colombo',
  address: '24 Temple Road',
}));
const produce = [
  ['Fresh Tomatoes', 'Vegetables', 340, 'tomato'],
  ['Organic Carrots', 'Vegetables', 420, 'carrot'],
  ['Ambul Bananas', 'Fruits', 220, 'banana'],
  ['Fresh Gotukola', 'Leafy Greens', 80, 'greens'],
  ['Upcountry Potatoes', 'Vegetables', 300, 'potato'],
  ['Red Onions', 'Vegetables', 280, 'onion'],
  ['Fresh Brinjal', 'Vegetables', 260, 'brinjal'],
  ['Green Beans', 'Vegetables', 480, 'beans'],
  ['Green Cabbage', 'Vegetables', 230, 'cabbage'],
  ['Sweet Pumpkin', 'Vegetables', 180, 'pumpkin'],
  ['Karuthakolomban Mango', 'Fruits', 450, 'mango'],
  ['Sweet Papaya', 'Fruits', 190, 'papaya'],
  ['Fresh Pineapple', 'Fruits', 360, 'pineapple'],
  ['Traditional Red Rice', 'Rice & Grains', 260, 'rice'],
  ['Green Gram', 'Pulses', 720, 'rice'],
  ['Fresh Coconut', 'Coconut Products', 140, 'coconut'],
  ['Ceylon Cinnamon', 'Spices', 950, 'spices'],
  ['Black Pepper', 'Spices', 780, 'spices'],
  ['Dried Chilli', 'Spices', 650, 'spices'],
  ['Fresh Curry Leaves', 'Herbs', 60, 'greens'],
  ['Pumpkin Seeds', 'Seeds', 450, 'rice'],
  ['Organic Salad Mix', 'Organic Products', 390, 'greens'],
  ['Farm Flower Bundle', 'Other Farm Products', 280, 'farm'],
];
export const products = Array.from({ length: 46 }, (_, i) => {
  const [name, category, price, img] = produce[i % produce.length];
  const f = farmers[i % 10];
  return {
    id: `p${i + 1}`,
    name: i >= 23 ? 'Farm Fresh ' + name.replace('Fresh ', '') : name,
    category,
    price: price + (i >= 23 ? 20 : 0),
    bulkPrice: Math.round(price * 0.9),
    bulkThreshold: 20,
    quantity: i === 7 ? 0 : i % 9 === 6 ? 4 : 25 + i * 3,
    unit:
      category === 'Leafy Greens' || category === 'Herbs'
        ? 'bundle'
        : img === 'coconut'
          ? 'piece'
          : 'kg',
    quality: qualities[i % 4],
    method: i === 1 ? 'Organic' : methods[i % 4],
    farmerId: f.id,
    district: f.district,
    city: f.city,
    rating: 4.5 + (i % 6) / 10,
    reviewCount: 12 + i * 2,
    popularity: 200 - i * 3,
    availability:
      i === 7
        ? 'Sold Out'
        : i % 11 === 10
          ? 'Upcoming Harvest'
          : i % 9 === 6
            ? 'Low Stock'
            : 'Available',
    delivery: true,
    pickup: i % 5 !== 4,
    harvestDate: '2026-09-16',
    availableDate: i % 11 === 10 ? '2026-09-25' : '2026-09-17',
    expiryDate: '2026-10-15',
    description:
      'Freshly harvested, carefully selected and packed at the farm. Bring the honest flavour of locally grown Sri Lankan produce to your table.',
    images: [images[img]],
    enabled: true,
    createdAt: new Date(2026, 8, 17 - (i % 15)).toISOString(),
    views: 80 + i * 7,
  };
});
export const orderSteps = (fulfillment) =>
  fulfillment === 'pickup'
    ? ['Pending', 'Confirmed', 'Preparing', 'Ready for Pickup', 'Completed']
    : ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Completed'];
export const orders = Array.from({ length: 25 }, (_, i) => {
  const p = products[i % 10];
  const c = customers[i % 5];
  const status = ['Pending', 'Confirmed', 'Preparing', 'Completed', 'Completed'][i % 5];
  return {
    id: `F2H-${1041 + i}`,
    customerId: c.id,
    customer: c.name,
    phone: c.phone,
    address: c.address + ', Colombo',
    farmerId: p.farmerId,
    items: [
      {
        productId: p.id,
        name: p.name,
        image: p.images[0],
        unit: p.unit,
        quantity: 2,
        price: p.price,
      },
    ],
    subtotal: p.price * 2,
    deliveryFee: 250,
    total: p.price * 2 + 250,
    fulfillment: 'delivery',
    payment: 'Cash on Delivery',
    status,
    date: '2026-09-16',
    estimatedDate: '2026-09-20',
  };
});
export const reviews = Array.from({ length: 30 }, (_, i) => ({
  id: `r${i}`,
  productId: `p${(i % 20) + 1}`,
  farmerId: `f${(i % 10) + 1}`,
  customer: customers[i % 20].name,
  customerId: customers[i % 20].id,
  rating: i % 5 === 0 ? 4 : 5,
  date: '2026-09-15',
  comment: [
    'So fresh and full of flavour. A lovely experience buying directly from the farm.',
    'Carefully packed and delivered on time. The quality was excellent.',
    'Wonderful produce. We will definitely order from this farm again.',
  ][i % 3],
}));
export const notifications = Array.from({ length: 20 }, (_, i) => ({
  id: `n${i}`,
  userId: i % 2 ? 'f1' : 'c1',
  title: i % 2 ? 'A new order is ready to confirm' : 'Your fresh produce order has an update',
  message:
    i % 2
      ? 'Check your orders to prepare the next harvest delivery.'
      : 'Visit your orders for the latest delivery details.',
  path: i % 2 ? '/farmer/orders' : '/customer/orders',
  read: i > 5,
  date: '2026-09-17',
}));
export const priceHistory = Array.from({ length: 30 }, (_, i) => ({
  day: `Sep ${i + 1}`,
  Tomato: Math.round(320 + Math.sin(i / 3) * 25 + i),
  Carrot: Math.round(390 + Math.cos(i / 4) * 30 + i),
  Potato: Math.round(275 + Math.sin(i / 5) * 20 + i),
}));
