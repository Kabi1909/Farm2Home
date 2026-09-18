import { useEffect, useRef } from 'react';
import { useCart, useUI } from '../context/AppContext';
import { flyToCart } from '../utils/flyToCart';

export default function useFlyToCart() {
  const { addToCart } = useCart();
  const { notify } = useUI();
  const flights = useRef(new Set());
  useEffect(
    () => () => {
      for (const flight of flights.current) flight.cancel();
      flights.current.clear();
    },
    [],
  );
  return (product, quantity, image) => {
    if (!addToCart(product, quantity, { silentSuccess: true })) return false;
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
