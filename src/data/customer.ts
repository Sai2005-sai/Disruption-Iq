import { Complaint, CustomerNotice, CustomerOrder } from '../types/domain';

export const customerOrders: CustomerOrder[] = [
{
  id: 'ORD-10482',
  items: '40 × Industrial Control Module',
  placed: '25 Oct 2026',
  status: 'Delayed',
  originalEta: 'Thu, 29 Oct · by 6:00 PM',
  revisedEta: 'Sat, 31 Oct · 10 AM – 1 PM',
  explanation:
  'Part of your order reached our Chennai hub later than planned, so it could not leave on time. We have arranged the full quantity from another of our locations and booked a new delivery slot. You do not need to do anything — we will message you when the driver is on the way.',
  verifiedAt: 'Verified by SwiftLane on 29 Oct, 10:42',
  destination: { lat: 13.0982, lng: 80.1622, label: 'Sundaram Motors, Ambattur' },
  current: { lat: 13.0694, lng: 80.1948, label: 'SwiftLane Hub, Koyambedu' },
  timeline: [
  { label: 'Order placed', time: '25 Oct, 11:20', state: 'done' },
  { label: 'Order confirmed', time: '25 Oct, 14:05', state: 'done' },
  { label: 'Delay identified', time: '29 Oct, 09:40', state: 'issue', note: 'Your order will not arrive on the original date' },
  { label: 'Replacement stock arranged', time: 'In progress', state: 'current' },
  { label: 'Out for delivery', time: 'Expected 31 Oct', state: 'upcoming' },
  { label: 'Delivered', time: '—', state: 'upcoming' }]

},
{
  id: 'ORD-10510',
  items: '8 × Industrial Control Module',
  placed: '27 Oct 2026',
  status: 'On track',
  originalEta: 'Tue, 3 Nov · 12 PM – 3 PM',
  revisedEta: null,
  explanation: null,
  verifiedAt: null,
  destination: { lat: 13.0012, lng: 80.2565, label: 'Bayline Foods, Adyar' },
  current: { lat: 13.0694, lng: 80.1948, label: 'SwiftLane Hub, Koyambedu' },
  timeline: [
  { label: 'Order placed', time: '27 Oct, 09:10', state: 'done' },
  { label: 'Order confirmed', time: '27 Oct, 10:00', state: 'done' },
  { label: 'Packed at hub', time: 'Scheduled 2 Nov', state: 'current' },
  { label: 'Out for delivery', time: 'Expected 3 Nov', state: 'upcoming' },
  { label: 'Delivered', time: '—', state: 'upcoming' }]

},
{
  id: 'ORD-10391',
  items: '12 × Control wiring harness',
  placed: '18 Oct 2026',
  status: 'Delivered',
  originalEta: 'Wed, 21 Oct · 2 PM – 5 PM',
  revisedEta: null,
  explanation: null,
  verifiedAt: null,
  destination: { lat: 13.0982, lng: 80.1622, label: 'Sundaram Motors, Ambattur' },
  current: { lat: 13.0982, lng: 80.1622, label: 'Delivered' },
  timeline: [
  { label: 'Order placed', time: '18 Oct, 16:45', state: 'done' },
  { label: 'Order confirmed', time: '18 Oct, 17:10', state: 'done' },
  { label: 'Out for delivery', time: '21 Oct, 11:30', state: 'done' },
  { label: 'Delivered', time: '21 Oct, 15:12', state: 'done', note: 'Received by R. Venkat' }]

}];


export const customerNotices: CustomerNotice[] = [
{ id: 'CN-1', kind: 'ETA change', title: 'New delivery slot for ORD-10482', body: 'Your order is now scheduled for Sat, 31 Oct between 10 AM and 1 PM.', time: 'Today, 10:44', unread: true },
{ id: 'CN-2', kind: 'Delay notice', title: 'ORD-10482 is running late', body: 'Part of your order arrived late at our hub. We are arranging it from another location.', time: 'Today, 09:42', unread: true },
{ id: 'CN-3', kind: 'Update', title: 'ORD-10510 confirmed', body: 'Expected delivery Tue, 3 Nov between 12 PM and 3 PM.', time: '27 Oct, 10:01', unread: false },
{ id: 'CN-4', kind: 'Resolution', title: 'Complaint CMP-1170 resolved', body: 'A replacement for the damaged harness box was delivered on 22 Oct.', time: '22 Oct, 17:30', unread: false }];


export const seedComplaints: Complaint[] = [
{ id: 'CMP-1182', orderId: 'ORD-10482', category: 'Late delivery', description: 'Production line at Ambattur depends on these modules. Please confirm the new slot is firm.', submitted: 'Today, 10:15', status: 'In review' },
{ id: 'CMP-1170', orderId: 'ORD-10391', category: 'Damaged packaging', description: 'One harness box was crushed on arrival.', submitted: '21 Oct, 16:02', status: 'Resolved' }];


export const complaintCategories = [
  'Late delivery / SLA breach',
  'Damaged packaging or contents',
  'Wrong items delivered',
  'Short shipment / missing quantity',
  'Invoice or billing discrepancy',
  'Driver unreachability or delivery refusal',
  'Incorrect delivery address or drop-off location',
  'Defective or poor quality batch',
  'Missing proof of delivery (POD) / documentation',
  'Unauthorized partial fulfillment',
  'Other'
];

export const chatSeed = [
{ id: 'm1', from: 'agent' as const, text: 'Hi Sneha, this is Divya from SwiftLane customer care. How can I help you today?', time: '10:46' }];