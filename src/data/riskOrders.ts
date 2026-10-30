import { RiskOrder } from '../types/domain';

export const riskOrders: RiskOrder[] = [
  {
    id: 'ORD-10482',
    customer: 'Sundaram Motors',
    area: 'Ambattur',
    priority: 'P1',
    deadlineHours: 18,
    deadlineLabel: '30 Oct, 06:00',
    quantity: 40,
    shortage: 40,
    factors: [
      { label: 'Deadline proximity', points: 33, max: 35, detail: 'Due in 18h — inside the 24h critical window' },
      { label: 'Stock shortage', points: 22, max: 25, detail: '40 of 40 units short (100%)' },
      { label: 'Order priority', points: 20, max: 20, detail: 'P1 · contractual line-stoppage SLA' },
      { label: 'Disruption severity', points: 17, max: 20, detail: 'Linked to DIS-2041 classified Major' }
    ]
  },
  {
    id: 'ORD-10477',
    customer: 'Coastal Pharma Equipment',
    area: 'Guindy',
    priority: 'P1',
    deadlineHours: 26,
    deadlineLabel: '30 Oct, 14:00',
    quantity: 30,
    shortage: 30,
    factors: [
      { label: 'Deadline proximity', points: 30, max: 35, detail: 'Due in 26h — inside the 36h window' },
      { label: 'Stock shortage', points: 19, max: 25, detail: '30 of 30 units short (100%)' },
      { label: 'Order priority', points: 20, max: 20, detail: 'P1 · regulated medical equipment assembly' },
      { label: 'Disruption severity', points: 17, max: 20, detail: 'Linked to DIS-2041 classified Major' }
    ]
  },
  {
    id: 'ORD-10485',
    customer: 'Bharat Heavy Electricals',
    area: 'Ennore',
    priority: 'P1',
    deadlineHours: 32,
    deadlineLabel: '30 Oct, 20:00',
    quantity: 25,
    shortage: 25,
    factors: [
      { label: 'Deadline proximity', points: 27, max: 35, detail: 'Due in 32h — inside 48h critical window' },
      { label: 'Stock shortage', points: 20, max: 25, detail: '25 of 25 units short (100%)' },
      { label: 'Order priority', points: 20, max: 20, detail: 'P1 · government grid power project' },
      { label: 'Disruption severity', points: 17, max: 20, detail: 'Linked to DIS-2041 classified Major' }
    ]
  },
  {
    id: 'ORD-10491',
    customer: 'Velan Auto Parts',
    area: 'Velachery',
    priority: 'P2',
    deadlineHours: 44,
    deadlineLabel: '31 Oct, 08:00',
    quantity: 25,
    shortage: 20,
    factors: [
      { label: 'Deadline proximity', points: 22, max: 35, detail: 'Due in 44h' },
      { label: 'Stock shortage', points: 18, max: 25, detail: '20 of 25 units short (80%)' },
      { label: 'Order priority', points: 14, max: 20, detail: 'P2 · Tier-1 OEM delivery' },
      { label: 'Disruption severity', points: 17, max: 20, detail: 'Linked to DIS-2041 classified Major' }
    ]
  },
  {
    id: 'ORD-10495',
    customer: 'Marina Robotics',
    area: 'Perungudi',
    priority: 'P2',
    deadlineHours: 60,
    deadlineLabel: '1 Nov, 00:00',
    quantity: 15,
    shortage: 15,
    factors: [
      { label: 'Deadline proximity', points: 18, max: 35, detail: 'Due in 60h' },
      { label: 'Stock shortage', points: 15, max: 25, detail: '15 of 15 units short (100%)' },
      { label: 'Order priority', points: 14, max: 20, detail: 'P2 · automated guided vehicle plant' },
      { label: 'Disruption severity', points: 17, max: 20, detail: 'Linked to DIS-2041 classified Major' }
    ]
  },
  {
    id: 'ORD-10498',
    customer: 'Southern Railway Coach',
    area: 'Perambur',
    priority: 'P2',
    deadlineHours: 66,
    deadlineLabel: '1 Nov, 06:00',
    quantity: 20,
    shortage: 15,
    factors: [
      { label: 'Deadline proximity', points: 17, max: 35, detail: 'Due in 66h' },
      { label: 'Stock shortage', points: 14, max: 25, detail: '15 of 20 units short (75%)' },
      { label: 'Order priority', points: 14, max: 20, detail: 'P2 · rolling stock retrofitting' },
      { label: 'Disruption severity', points: 17, max: 20, detail: 'Linked to DIS-2041 classified Major' }
    ]
  },
  {
    id: 'ORD-10501',
    customer: 'Ashok Leyland Assembly',
    area: 'Sriperumbudur',
    priority: 'P2',
    deadlineHours: 72,
    deadlineLabel: '1 Nov, 12:00',
    quantity: 18,
    shortage: 12,
    factors: [
      { label: 'Deadline proximity', points: 15, max: 35, detail: 'Due in 3 days' },
      { label: 'Stock shortage', points: 12, max: 25, detail: '12 of 18 units short (67%)' },
      { label: 'Order priority', points: 14, max: 20, detail: 'P2 · commercial vehicle chassis' },
      { label: 'Disruption severity', points: 17, max: 20, detail: 'Linked to DIS-2041 classified Major' }
    ]
  },
  {
    id: 'ORD-10503',
    customer: 'Lakshmi Machine Tools',
    area: 'Ambattur',
    priority: 'P3',
    deadlineHours: 84,
    deadlineLabel: '2 Nov, 00:00',
    quantity: 12,
    shortage: 10,
    factors: [
      { label: 'Deadline proximity', points: 12, max: 35, detail: 'Due in 3d 12h' },
      { label: 'Stock shortage', points: 9, max: 25, detail: '10 of 12 units short (83%)' },
      { label: 'Order priority', points: 10, max: 20, detail: 'P3 · flexible delivery window' },
      { label: 'Disruption severity', points: 17, max: 20, detail: 'Linked to DIS-2041 classified Major' }
    ]
  },
  {
    id: 'ORD-10506',
    customer: 'Kaveri Precision Drives',
    area: 'Oragadam',
    priority: 'P3',
    deadlineHours: 96,
    deadlineLabel: '2 Nov, 12:00',
    quantity: 10,
    shortage: 8,
    factors: [
      { label: 'Deadline proximity', points: 10, max: 35, detail: 'Due in 4 days' },
      { label: 'Stock shortage', points: 8, max: 25, detail: '8 of 10 units short (80%)' },
      { label: 'Order priority', points: 10, max: 20, detail: 'P3 · transmission subassemblies' },
      { label: 'Disruption severity', points: 17, max: 20, detail: 'Linked to DIS-2041 classified Major' }
    ]
  },
  {
    id: 'ORD-10508',
    customer: 'Madras Fertilizers Lab',
    area: 'Manali',
    priority: 'P3',
    deadlineHours: 108,
    deadlineLabel: '3 Nov, 00:00',
    quantity: 10,
    shortage: 5,
    factors: [
      { label: 'Deadline proximity', points: 7, max: 35, detail: 'Due in 4d 12h' },
      { label: 'Stock shortage', points: 5, max: 25, detail: '5 of 10 units short (50%)' },
      { label: 'Order priority', points: 10, max: 20, detail: 'P3 · instrumentation telemetry' },
      { label: 'Disruption severity', points: 17, max: 20, detail: 'Linked to DIS-2041 classified Major' }
    ]
  },
  {
    id: 'ORD-10510',
    customer: 'Bayline Foods',
    area: 'Adyar',
    priority: 'P4',
    deadlineHours: 120,
    deadlineLabel: '3 Nov, 12:00',
    quantity: 8,
    shortage: 5,
    factors: [
      { label: 'Deadline proximity', points: 4, max: 35, detail: 'Due in 5d' },
      { label: 'Stock shortage', points: 4, max: 25, detail: '5 of 8 units short (63%)' },
      { label: 'Order priority', points: 2, max: 20, detail: 'P4 · replenishment stock' },
      { label: 'Disruption severity', points: 17, max: 20, detail: 'Linked to DIS-2041 classified Major' }
    ]
  },
  {
    id: 'ORD-10514',
    customer: 'Coromandel Engineering',
    area: 'Tondiarpet',
    priority: 'P4',
    deadlineHours: 132,
    deadlineLabel: '4 Nov, 00:00',
    quantity: 6,
    shortage: 4,
    factors: [
      { label: 'Deadline proximity', points: 2, max: 35, detail: 'Due in 5d 12h' },
      { label: 'Stock shortage', points: 3, max: 25, detail: '4 of 6 units short (67%)' },
      { label: 'Order priority', points: 2, max: 20, detail: 'P4 · buffer inventory' },
      { label: 'Disruption severity', points: 17, max: 20, detail: 'Linked to DIS-2041 classified Major' }
    ]
  }
];