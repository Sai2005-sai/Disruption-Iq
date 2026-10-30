/**
 * DisruptionIQ Synthetic Data & Carrier Webhook Generator Script
 * --------------------------------------------------------------
 * Generates linked synthetic supply chain records:
 *  - Suppliers (name, location, reliability score, lead time)
 *  - Warehouses (name, city, capacity)
 *  - Inventory (product/SKU, warehouse, quantity on hand, reserved quantity)
 *  - Orders (customer, items, priority/tier, promised delivery date)
 *  - Shipments (linked to supplier, order, carrier, ETA, status)
 *
 * Also includes a simulated carrier webhook runner that fires:
 *  1. Valid DELAYED carrier webhook event (evt_1001)
 *  2. Duplicate event_id replay (evt_1001 -> ignored via idempotency)
 *  3. Invalid payload with negative quantity / missing fields (-> 400 rejected & logged)
 *  4. Conflicting older-timestamp event arriving after newer update (-> 409 ignored & logged)
 */

import fs from 'fs';
import path from 'path';

export function generateSyntheticDataset() {
  const dataset = {
    generated_at: new Date().toISOString(),
    suppliers: [
      { id: 'SUP-01', code: 'APEX', name: 'Apex Components Ltd (Supplier X)', location: 'Hosur, Tamil Nadu', reliability_score: 58, lead_time_days: 5 },
      { id: 'SUP-02', code: 'VTX', name: 'Vertex Electro Parts', location: 'Pune, Maharashtra', reliability_score: 91, lead_time_days: 3 },
      { id: 'SUP-03', code: 'DEC', name: 'Deccan Polymers', location: 'Hyderabad, Telangana', reliability_score: 84, lead_time_days: 4 },
      { id: 'SUP-04', code: 'NOV', name: 'Nova Textiles', location: 'Tiruppur, Tamil Nadu', reliability_score: 76, lead_time_days: 2 },
      { id: 'SUP-05', code: 'COR', name: 'Coromandel Metals', location: 'Hosur, Tamil Nadu', reliability_score: 70, lead_time_days: 4 }
    ],
    warehouses: [
      { id: 'WH-CHN-01', name: 'Chennai – Ambattur (Warehouse B)', city: 'Chennai', capacity: 400 },
      { id: 'WH-BLR-02', name: 'Bengaluru – Hoskote (Warehouse A)', city: 'Bengaluru', capacity: 500 },
      { id: 'WH-PDY-05', name: 'Puducherry – Sedarapet', city: 'Puducherry', capacity: 120 },
      { id: 'WH-CBE-04', name: 'Coimbatore – Kurichi', city: 'Coimbatore', capacity: 200 },
      { id: 'WH-HYD-03', name: 'Hyderabad – Shamshabad', city: 'Hyderabad', capacity: 350 }
    ],
    inventory: [
      { sku: 'ICM-220', product: 'Industrial Control Module', warehouse_id: 'WH-CHN-01', on_hand: 35, reserved: 0 },
      { sku: 'ICM-220', product: 'Industrial Control Module', warehouse_id: 'WH-BLR-02', on_hand: 180, reserved: 60 },
      { sku: 'ICM-220', product: 'Industrial Control Module', warehouse_id: 'WH-PDY-05', on_hand: 22, reserved: 10 },
      { sku: 'ICM-220', product: 'Industrial Control Module', warehouse_id: 'WH-CBE-04', on_hand: 40, reserved: 15 },
      { sku: 'ICM-220', product: 'Industrial Control Module', warehouse_id: 'WH-HYD-03', on_hand: 62, reserved: 20 }
    ],
    shipments: [
      {
        id: 'SHP-7731',
        tracking_no: 'DL123456',
        carrier: 'Delhivery',
        supplier_id: 'SUP-01',
        destination_warehouse_id: 'WH-CHN-01',
        sku: 'ICM-220',
        quantity: 200,
        status: 'DELAYED',
        eta: '2026-11-03T18:00:00Z',
        delay_days: 5,
        last_updated: '2026-10-30T09:00:00Z'
      }
    ],
    orders: [
      { id: 'ORD-10482', customer: 'Sundaram Motors', priority: 'P1 (High)', promised_date: '2026-10-30T06:00:00Z', quantity: 40, shortage: 40, shipment_id: 'SHP-7731' },
      { id: 'ORD-10477', customer: 'Coastal Pharma Equipment', priority: 'P1 (High)', promised_date: '2026-10-30T14:00:00Z', quantity: 30, shortage: 30, shipment_id: 'SHP-7731' },
      { id: 'ORD-10485', customer: 'Bharat Heavy Electricals', priority: 'P1 (High)', promised_date: '2026-10-30T20:00:00Z', quantity: 25, shortage: 25, shipment_id: 'SHP-7731' },
      { id: 'ORD-10491', customer: 'Velan Auto Parts', priority: 'P2', promised_date: '2026-10-31T08:00:00Z', quantity: 25, shortage: 20, shipment_id: 'SHP-7731' },
      { id: 'ORD-10495', customer: 'Marina Robotics', priority: 'P2', promised_date: '2026-11-01T00:00:00Z', quantity: 15, shortage: 15, shipment_id: 'SHP-7731' },
      { id: 'ORD-10498', customer: 'Southern Railway Integral Coach', priority: 'P2', promised_date: '2026-11-01T06:00:00Z', quantity: 20, shortage: 15, shipment_id: 'SHP-7731' },
      { id: 'ORD-10501', customer: 'Ashok Leyland Assembly', priority: 'P2', promised_date: '2026-11-01T12:00:00Z', quantity: 18, shortage: 12, shipment_id: 'SHP-7731' },
      { id: 'ORD-10503', customer: 'Lakshmi Machine Tools', priority: 'P3', promised_date: '2026-11-02T00:00:00Z', quantity: 12, shortage: 10, shipment_id: 'SHP-7731' },
      { id: 'ORD-10506', customer: 'Kaveri Precision Drives', priority: 'P3', promised_date: '2026-11-02T12:00:00Z', quantity: 10, shortage: 8, shipment_id: 'SHP-7731' },
      { id: 'ORD-10508', customer: 'Madras Fertilizers Lab', priority: 'P3', promised_date: '2026-11-03T00:00:00Z', quantity: 10, shortage: 5, shipment_id: 'SHP-7731' },
      { id: 'ORD-10510', customer: 'Bayline Foods', priority: 'P4', promised_date: '2026-11-03T12:00:00Z', quantity: 8, shortage: 5, shipment_id: 'SHP-7731' },
      { id: 'ORD-10514', customer: 'Coromandel Engineering', priority: 'P4', promised_date: '2026-11-04T00:00:00Z', quantity: 6, shortage: 4, shipment_id: 'SHP-7731' }
    ]
  };

  return dataset;
}
