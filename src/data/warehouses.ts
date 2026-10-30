import { Warehouse } from '../types/domain';

export const warehouses: Warehouse[] = [
{
  id: 'WH-CHN-01',
  name: 'Chennai · Ambattur',
  city: 'Chennai',
  lat: 13.1143,
  lng: 80.1548,
  distanceKm: 0,
  eta: 'Origin',
  stock: 35,
  capacity: 400,
  operator: 'Suresh Babu',
  lastCount: '29 Oct, 10:12',
  role: 'Affected'
},
{
  id: 'WH-PDY-05',
  name: 'Puducherry · Sedarapet',
  city: 'Puducherry',
  lat: 11.9839,
  lng: 79.7616,
  distanceKm: 152,
  eta: '3h 10m',
  stock: 22,
  capacity: 120,
  operator: 'Anand Selvam',
  lastCount: '28 Oct, 18:40',
  role: 'Nearby'
},
{
  id: 'WH-BLR-02',
  name: 'Bengaluru · Hoskote',
  city: 'Bengaluru',
  lat: 13.0707,
  lng: 77.7982,
  distanceKm: 318,
  eta: '6h 40m',
  stock: 180,
  capacity: 500,
  operator: 'Naveen Gowda',
  lastCount: '29 Oct, 07:55',
  role: 'Transfer source'
},
{
  id: 'WH-CBE-04',
  name: 'Coimbatore · Kurichi',
  city: 'Coimbatore',
  lat: 10.9601,
  lng: 76.9558,
  distanceKm: 505,
  eta: '9h 05m',
  stock: 40,
  capacity: 200,
  operator: 'Deepa Krishnan',
  lastCount: '28 Oct, 20:15',
  role: 'Nearby'
},
{
  id: 'WH-HYD-03',
  name: 'Hyderabad · Shamshabad',
  city: 'Hyderabad',
  lat: 17.2403,
  lng: 78.4294,
  distanceKm: 627,
  eta: '11h 20m',
  stock: 62,
  capacity: 350,
  operator: 'Lokesh Naidu',
  lastCount: '29 Oct, 06:30',
  role: 'Affected'
}];