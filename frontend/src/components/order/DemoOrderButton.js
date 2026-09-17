import { useAuth, useMarket, useUI } from '../../context/AppContext';
import { customers } from '../../data/seed';

/** Creates an explicitly labeled test order for a newly registered farmer. */
export default function DemoOrderButton() {
  const { user } = useAuth();
  const { products, setProducts, setOrders, addNotice } = useMarket();
  const { notify } = useUI();
  function receiveOrder() {
    const product = products.find(
      (item) =>
        item.farmerId === user.id &&
        item.enabled &&
        !item.draft &&
        item.quantity > 0 &&
        item.availability !== 'Sold Out',
    );
    if (!product) {
      notify('Publish a product with available stock first.', 'error');
      return;
    }
    const quantity = Math.min(2, product.quantity);
    const fulfillment = product.delivery ? 'delivery' : 'pickup';
    const subtotal = product.price * quantity;
    const deliveryFee = fulfillment === 'delivery' ? 250 : 0;
    const order = {
      id: 'F2H-' + crypto.randomUUID().slice(0, 8).toUpperCase(),
      customerId: customers[0].id,
      customer: customers[0].name,
      phone: customers[0].phone,
      address: '24 Temple Road, Colombo (demo address)',
      farmerId: user.id,
      items: [
        {
          productId: product.id,
          name: product.name,
          image: product.images[0],
          unit: product.unit,
          quantity,
          price: product.price,
          preorder: product.availability === 'Upcoming Harvest',
          availableDate: product.availableDate,
        },
      ],
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      fulfillment,
      payment: fulfillment === 'delivery' ? 'Cash on Delivery' : 'Pay on Pickup',
      status: 'Pending',
      date: new Date().toISOString().slice(0, 10),
      estimatedDate:
        product.availability === 'Upcoming Harvest'
          ? product.availableDate
          : new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      simulated: true,
    };
    setOrders((old) => [order, ...old]);
    setProducts((old) =>
      old.map((item) =>
        item.id === product.id
          ? {
              ...item,
              quantity: item.quantity - quantity,
              availability: item.quantity === quantity ? 'Sold Out' : item.availability,
            }
          : item,
      ),
    );
    addNotice(user.id, 'New demo order ' + order.id, '/farmer/orders/' + order.id);
    notify('Demo customer order received. You can now manage its status.');
  }
  return (
    <button className="btn secondary" onClick={receiveOrder}>
      Receive mock order
    </button>
  );
}
