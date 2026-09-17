import { readStore,writeStore } from '../utils/helpers';
export const wishlistService={get:userId=>readStore('wishlist',{})[userId]||[],save:(userId,items)=>writeStore('wishlist',{...readStore('wishlist',{}),[userId]:items})};
