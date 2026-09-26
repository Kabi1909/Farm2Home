import { jsPDF } from 'jspdf';

const currency = (value) =>
  `Rs. ${Number(value || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Uses the confirmed order snapshots, never the current catalogue or cart prices.
export function createOrderPdf(orders, farmers = []) {
  if (!orders.length) throw new Error('No confirmed orders are available to download.');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  pdf.setProperties({ title: 'Farm2Home LK - Order details', author: 'Farm2Home LK' });
  let y = 20;

  function newPage() {
    pdf.addPage();
    y = 20;
  }

  function line(text, { bold = false, size = 10, color = [38, 48, 41] } = {}) {
    const value = String(text ?? '').replace(/[\r\n\t]+/g, ' ');
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
    // Browser fonts preserve Sinhala/Tamil names without uploading customer data
    // or depending on a remote font service. Latin text stays selectable in the PDF.
    if (/[^\x20-\x7e]/.test(value)) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 1400;
      canvas.height = 70;
      const fontSize = ((size * 1400) / 170) * 0.3528;
      context.font = `${bold ? 'bold' : 'normal'} ${fontSize}px sans-serif`;
      const rows = [];
      let current = '';
      for (const character of Array.from(value)) {
        if (current && context.measureText(current + character).width > 1380) {
          rows.push(current);
          current = '';
        }
        current += character;
      }
      rows.push(current);
      for (const row of rows) {
        if (y > 272) newPage();
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = `rgb(${color.join(',')})`;
        context.fillText(row, 0, 45);
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 20, y - 5.5, 170, 8.5);
        y += 7;
      }
      return;
    }
    for (const row of pdf.splitTextToSize(value, 170)) {
      if (y > 272) newPage();
      pdf.text(row, 20, y);
      y += size > 14 ? 9 : 6;
    }
  }

  orders.forEach((order, index) => {
    if (index) newPage();
    line('Farm2Home LK', { bold: true, size: 22, color: [47, 107, 59] });
    line('ORDER DETAILS', { bold: true, size: 12 });
    line(`Order ${index + 1} of ${orders.length} in this checkout`);
    y += 4;
    line(`Reference: ${order.orderNumber || order.id}`, { bold: true });
    line(`Tracking ID: ${order.id}`);
    line(`Placed: ${order.date} | Order status: ${order.status}`);
    line(
      `Farm: ${farmers.find((farmer) => farmer.id === order.farmerId)?.farm || 'Farmer ' + order.farmerId}`,
    );
    line(`Customer: ${order.customer}`);
    if (order.phone) line(`Phone: ${order.phone}`);
    line(`Fulfillment: ${order.fulfillment === 'delivery' ? 'Home delivery' : 'Farm pickup'}`);
    if (order.fulfillment === 'delivery') {
      const address = order.deliveryAddress || {};
      line(
        `Delivery address: ${[order.address, address.city, address.district].filter(Boolean).join(', ')}`,
      );
    } else {
      line(
        `Pickup: ${order.pickupDetails || 'Coordinate collection with your farmer after confirmation.'}`,
      );
    }
    line(`Payment method: ${order.payment}`);
    line(`Payment status: ${order.paymentStatus || 'pending'}`);
    y += 5;
    line('PRODUCTS', { bold: true, size: 12 });
    order.items.forEach((item) => {
      if (y > 250) newPage();
      line(item.name, { bold: true });
      line(
        `${item.quantity} ${item.unit} x ${currency(item.price)} / ${item.unit} = ${currency(item.lineTotal ?? item.price * item.quantity)}`,
      );
      if (item.isBulkPrice) line('Bulk price applied.');
      if (item.preorder)
        line(`Pre-order: available ${item.availableDate || 'date to be confirmed'}`);
      y += 3;
    });
    if (y > 240) newPage();
    y += 3;
    line(`Subtotal: ${currency(order.subtotal)}`);
    line(`Delivery: ${currency(order.deliveryFee)}`);
    line(`Order total: ${currency(order.total)}`, { bold: true, size: 12 });
    line('Order confirmation only. This document is not proof of payment.', { size: 9 });
  });

  if (orders.length > 1) {
    if (y > 252) newPage();
    y += 6;
    line(
      `Checkout total: ${currency(orders.reduce((sum, order) => sum + Number(order.total), 0))}`,
      {
        bold: true,
        size: 12,
      },
    );
  }
  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    pdf.setPage(page);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(98, 114, 103);
    pdf.text(`Farm2Home LK | Page ${page} of ${pages}`, 20, 287);
  }
  return pdf;
}

export async function downloadOrderPdf(orders, farmers) {
  const pdf = createOrderPdf(orders, farmers);
  const reference = String(orders[0].orderNumber || orders[0].id).replace(/[^a-zA-Z0-9_-]/g, '-');
  await pdf.save(`Farm2Home-order-${reference}.pdf`, { returnPromise: true });
}
