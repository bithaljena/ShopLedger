'use strict';

const test = require('node:test');
const assert = require('node:assert');

const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function assertCurrentInvoice(order, expected) {
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const checkoutFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepStrictEqual({
    subtotal: invoiceFigures.subtotal,
    discount: invoiceFigures.discount,
    tax: invoiceFigures.tax,
    cgst: invoiceFigures.cgst,
    sgst: invoiceFigures.sgst,
    total: invoiceFigures.total,
    rows: invoiceFigures.rows.map(function (row) {
      return { gstPercent: row.gstPercent, line: row.line, lineTax: row.lineTax };
    })
  }, expected);
  assert.deepStrictEqual(invoiceFigures.subtotal, checkoutFigures.subtotal);
  assert.deepStrictEqual(invoiceFigures.discount, checkoutFigures.discount);
  assert.deepStrictEqual(invoiceFigures.tax, checkoutFigures.tax);
  assert.deepStrictEqual(invoiceFigures.cgst, checkoutFigures.cgst);
  assert.deepStrictEqual(invoiceFigures.sgst, checkoutFigures.sgst);
  assert.deepStrictEqual(invoiceFigures.total, checkoutFigures.total);
  assert.deepStrictEqual(
    invoiceFigures.rows.map(function (row) {
      return { gstPercent: row.gstPercent, line: row.line, lineTax: row.lineTax };
    }),
    checkoutFigures.lines.map(function (line) {
      return { gstPercent: line.gstPercent, line: line.gross, lineTax: line.tax };
    })
  );
}

test('CURRENT BEHAVIOUR: #1001 invoices mixed 5% and 12% items without a coupon', function () {
  assertCurrentInvoice({
    items: [
      { id: 1, name: 'Rice', hsn: '1006', gstRate: 5, price: 640, qty: 1 },
      { id: 2, name: 'Ghee', hsn: '0405', gstRate: 12, price: 450, qty: 1 }
    ],
    coupon: ''
  }, {
    subtotal: 1090,
    discount: 0,
    tax: 86,
    cgst: 43,
    sgst: 43,
    total: 1176,
    rows: [
      { gstPercent: 5, line: 640, lineTax: 32 },
      { gstPercent: 12, line: 450, lineTax: 54 }
    ]
  });
});

test('CURRENT BEHAVIOUR: #1002 SAVE10 uses a 10% discount on the ₹1,020 subtotal', function () {
  assertCurrentInvoice({
    items: [
      { id: 1, name: 'Rice', hsn: '1006', gstRate: 5, price: 640, qty: 1 },
      { id: 4, name: 'Sunflower oil', hsn: '1512', gstRate: 5, price: 190, qty: 2 }
    ],
    coupon: 'SAVE10'
  }, {
    subtotal: 1020,
    discount: 102,
    tax: 45.9,
    cgst: 22.95,
    sgst: 22.95,
    total: 963.9,
    rows: [
      { gstPercent: 5, line: 640, lineTax: 28.8 },
      { gstPercent: 5, line: 380, lineTax: 17.1 }
    ]
  });
});

test('CURRENT BEHAVIOUR: #1004 SAVE10 discount is capped at ₹150 on ₹2,240', function () {
  assertCurrentInvoice({
    items: [
      { id: 5, name: 'Groundnut oil', hsn: '1508', gstRate: 5, price: 1120, qty: 2 }
    ],
    coupon: 'SAVE10'
  }, {
    subtotal: 2240,
    discount: 150,
    tax: 104.5,
    cgst: 52.25,
    sgst: 52.25,
    total: 2194.5,
    rows: [
      { gstPercent: 5, line: 2240, lineTax: 104.5 }
    ]
  });
});

test('CURRENT BEHAVIOUR: #1008 items both use 18% GST without a coupon', function () {
  assertCurrentInvoice({
    items: [
      { id: 8, name: 'Packaged tea', hsn: '0902', gstRate: 18, price: 140, qty: 1 },
      { id: 12, name: 'Sherbet', hsn: '2106', gstRate: 18, price: 180, qty: 2 }
    ],
    coupon: ''
  }, {
    subtotal: 500,
    discount: 0,
    tax: 90,
    cgst: 45,
    sgst: 45,
    total: 590,
    rows: [
      { gstPercent: 18, line: 140, lineTax: 25.2 },
      { gstPercent: 18, line: 360, lineTax: 64.8 }
    ]
  });
});

test('invoice matches checkout HSN GST and post-discount totals for ticket orders', function () {
  const cases = [
    {
      id: 1001,
      items: [
        { id: 1, name: 'Rice', hsn: '1006', price: 640, qty: 1 },
        { id: 2, name: 'Ghee', hsn: '0405', price: 450, qty: 1 }
      ],
      coupon: '',
      expected: { subtotal: 1090, discount: 0, tax: 86, total: 1176 }
    },
    {
      id: 1002,
      items: [
        { id: 1, name: 'Rice', hsn: '1006', price: 640, qty: 1 },
        { id: 4, name: 'Sunflower oil', hsn: '1512', price: 190, qty: 2 }
      ],
      coupon: 'SAVE10',
      expected: { subtotal: 1020, discount: 102, tax: 45.9, total: 963.9 }
    },
    {
      id: 1004,
      items: [
        { id: 5, name: 'Groundnut oil', hsn: '1508', price: 1120, qty: 2 }
      ],
      coupon: 'SAVE10',
      expected: { subtotal: 2240, discount: 150, tax: 104.5, total: 2194.5 }
    },
    {
      id: 1008,
      items: [
        { id: 8, name: 'Packaged tea', hsn: '0902', price: 140, qty: 1 },
        { id: 12, name: 'Sherbet', hsn: '2106', price: 180, qty: 2 }
      ],
      coupon: '',
      expected: { subtotal: 500, discount: 0, tax: 90, total: 590 }
    }
  ];

  cases.forEach(function (order) {
    const invoiceFigures = invoice.computeInvoiceFigures(order);
    const checkoutFigures = pricing.computeTotals(order.items, order.coupon);

    assert.deepStrictEqual({
      subtotal: invoiceFigures.subtotal,
      discount: invoiceFigures.discount,
      tax: invoiceFigures.tax,
      total: invoiceFigures.total
    }, order.expected, 'invoice totals for order #' + order.id);
    assert.deepStrictEqual(invoiceFigures.subtotal, checkoutFigures.subtotal);
    assert.deepStrictEqual(invoiceFigures.discount, checkoutFigures.discount);
    assert.deepStrictEqual(invoiceFigures.tax, checkoutFigures.tax);
    assert.deepStrictEqual(invoiceFigures.total, checkoutFigures.total);
    assert.deepStrictEqual(invoiceFigures.rows.map(function (row) {
      return { gstPercent: row.gstPercent, lineTax: row.lineTax };
    }), checkoutFigures.lines.map(function (line) {
      return { gstPercent: line.gstPercent, lineTax: line.tax };
    }));
  });
});
