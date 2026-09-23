import { useEffect, useRef } from 'react';
import { useCart, useUI } from '../context/AppContext';
import { flyToCart } from '../utils/flyToCart';

export default function useFlyToCart() {
  const { addToCart } = useCart();
  const { notify } = useUI();
  const flights = useRef(new Set());
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      for (const flight of flights.current) flight.cancel();
      flights.current.clear();
    };
  }, []);
  return async (product, quantity, image) => {
    if (!(await addToCart(product, quantity, { silentSuccess: true }))) return false;
    if (!mounted.current) {
      notify(`${product.name} added to cart`);
      return true;
    }
    const success = () => notify(`${product.name} added to cart`);
    // Bound temporary visuals during bursts without dropping any cart additions.
    if (flights.current.size >= 8) {
      success();
      return true;
    }
    try {
      let flight;
      flight = flyToCart(image, success, () => flights.current.delete(flight));
      if (flight.active) flights.current.add(flight);
    } catch {
      success();
    }
    return true;
  };
}
