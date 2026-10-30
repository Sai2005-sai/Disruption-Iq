import { ParentRequest } from '../types/domain';

export const parentRequests: ParentRequest[] = [
{
  id: 'REQ-551',
  type: 'Transfer approval',
  title: 'Transfer 120 × ICM-220 Bengaluru → Chennai',
  from: 'Meera Iyer · SwiftLane Logistics',
  received: '29 Oct, 10:05',
  status: 'Pending',
  priority: 'Critical',
  linkedCase: 'RC-2041',
  order: { id: 'ORD-10482', customer: 'Sundaram Motors', deadline: '30 Oct, 06:00', value: '₹9,60,000' },
  shipment: { id: 'SHP-7731', origin: 'Hosur', destination: 'Chennai WH-CHN-01', status: 'Delayed 4 days', mode: 'Road freight' },
  products: [
  { sku: 'ICM-220', name: 'Industrial Control Module', requested: 120, onHand: 180, location: 'WH-BLR-02', availability: 'Available' },
  { sku: 'HRN-12', name: 'Control wiring harness', requested: 120, onHand: 74, location: 'WH-BLR-02', availability: 'Partially Available' }],

  note: 'Bengaluru keeps 60 units for its own committed demand after transfer.'
},
{
  id: 'REQ-549',
  type: 'Stock confirmation',
  title: 'Confirm ICM-220 stock at Hyderabad',
  from: 'Priya Raman · SwiftLane Logistics',
  received: '29 Oct, 09:48',
  status: 'Pending',
  priority: 'High',
  linkedCase: 'RC-2041',
  order: { id: 'ORD-10491', customer: 'Velan Auto Parts', deadline: '31 Oct, 08:00', value: '₹6,00,000' },
  shipment: { id: 'SHP-7731', origin: 'Hosur', destination: 'Hyderabad WH-HYD-03', status: 'Delayed 4 days', mode: 'Road freight' },
  products: [
  { sku: 'ICM-220', name: 'Industrial Control Module', requested: 28, onHand: 62, location: 'WH-HYD-03', availability: 'Available' }],

  note: 'Needed to rule Hyderabad in or out as a secondary transfer source.'
},
{
  id: 'REQ-546',
  type: 'Stock confirmation',
  title: 'Confirm PSU-48V stock at Coimbatore',
  from: 'Priya Raman · SwiftLane Logistics',
  received: '29 Oct, 08:20',
  status: 'Pending',
  priority: 'Moderate',
  linkedCase: 'RC-2039',
  order: { id: 'ORD-10468', customer: 'Kovai Pumps', deadline: '1 Nov, 18:00', value: '₹2,40,000' },
  shipment: { id: 'SHP-7722', origin: 'Pune', destination: 'Coimbatore WH-CBE-04', status: 'In transit', mode: 'Road freight' },
  products: [
  { sku: 'PSU-48V', name: '48V power supply unit', requested: 40, onHand: 0, location: 'WH-CBE-04', availability: 'Unavailable' }],

  note: 'Customer accepts a split delivery if fewer than 40 are available.'
},
{
  id: 'REQ-541',
  type: 'Transfer approval',
  title: 'Transfer 24 × FAB-112 Bengaluru → Hyderabad',
  from: 'Meera Iyer · SwiftLane Logistics',
  received: '28 Oct, 15:30',
  status: 'Approved',
  priority: 'Low',
  linkedCase: 'RC-2035',
  order: { id: 'ORD-10402', customer: 'Charminar Garments', deadline: '30 Oct, 12:00', value: '₹1,10,000' },
  shipment: { id: 'SHP-7745', origin: 'Tiruppur', destination: 'Bengaluru WH-BLR-02', status: 'On track', mode: 'Road freight' },
  products: [
  { sku: 'FAB-112', name: 'Cotton twill roll', requested: 24, onHand: 310, location: 'WH-BLR-02', availability: 'Available' }],

  note: 'Approved by Rahul Khanna on 28 Oct, 16:02.'
}];