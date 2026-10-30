import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'disruptioniq.db');
export const db = new Database(dbPath);

// Enable WAL mode and foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      plant_location TEXT NOT NULL,
      performance_score INTEGER NOT NULL,
      contact TEXT
    );

    CREATE TABLE IF NOT EXISTS warehouses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      distance_km REAL NOT NULL,
      eta TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      operator TEXT NOT NULL,
      last_count TEXT NOT NULL,
      role TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      warehouse_id TEXT NOT NULL,
      sku TEXT NOT NULL,
      product_name TEXT NOT NULL,
      on_hand INTEGER NOT NULL,
      reserved INTEGER NOT NULL DEFAULT 0,
      safety_stock INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
    );

    CREATE TABLE IF NOT EXISTS shipments (
      id TEXT PRIMARY KEY,
      supplier_id TEXT NOT NULL,
      destination_warehouse_id TEXT NOT NULL,
      sku TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      mode TEXT NOT NULL,
      status TEXT NOT NULL,
      original_eta TEXT NOT NULL,
      revised_eta TEXT,
      delay_days REAL NOT NULL DEFAULT 0,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer TEXT NOT NULL,
      area TEXT NOT NULL,
      priority TEXT NOT NULL,
      deadline_hours REAL NOT NULL,
      deadline_label TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      shortage INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'Delayed',
      original_eta TEXT NOT NULL,
      revised_eta TEXT,
      explanation TEXT,
      verified_at TEXT,
      lat REAL,
      lng REAL,
      factors_json TEXT
    );

    CREATE TABLE IF NOT EXISTS disruption_alerts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      source TEXT NOT NULL,
      reference TEXT NOT NULL,
      severity TEXT NOT NULL,
      status TEXT NOT NULL,
      detected TEXT NOT NULL,
      minutes_ago INTEGER NOT NULL,
      location TEXT NOT NULL,
      description TEXT NOT NULL,
      suggested TEXT NOT NULL,
      suggestion_reason TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recovery_plans (
      id TEXT PRIMARY KEY,
      disruption_id TEXT NOT NULL,
      option_id TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      cost INTEGER NOT NULL,
      time_saved_days REAL NOT NULL,
      orders_covered INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      dispatch_mode TEXT NOT NULL,
      created_by TEXT,
      created_by_role TEXT,
      created_at TEXT,
      state TEXT NOT NULL,
      stale INTEGER NOT NULL DEFAULT 0,
      executed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS workflow_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id TEXT NOT NULL,
      step_order INTEGER NOT NULL,
      role TEXT NOT NULL,
      status TEXT NOT NULL,
      by_user TEXT,
      at_time TEXT,
      comment TEXT,
      FOREIGN KEY (plan_id) REFERENCES recovery_plans(id)
    );

    CREATE TABLE IF NOT EXISTS audit_trail (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      user TEXT NOT NULL,
      role TEXT NOT NULL,
      action TEXT NOT NULL,
      target TEXT NOT NULL,
      reason TEXT NOT NULL,
      before_val TEXT,
      after_val TEXT
    );

    CREATE TABLE IF NOT EXISTS parent_requests (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      from_org TEXT NOT NULL,
      received TEXT NOT NULL,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      linked_case TEXT NOT NULL,
      order_json TEXT NOT NULL,
      shipment_json TEXT NOT NULL,
      products_json TEXT NOT NULL,
      note TEXT
    );

    CREATE TABLE IF NOT EXISTS carrier_webhooks (
      id TEXT PRIMARY KEY,
      idempotency_key TEXT UNIQUE NOT NULL,
      carrier TEXT NOT NULL,
      awb TEXT NOT NULL,
      event_type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      received_at TEXT NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS agent_tickets (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      delay_minutes INTEGER NOT NULL,
      notes TEXT,
      photo_count INTEGER NOT NULL,
      outcome TEXT NOT NULL,
      submitted_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      submitted TEXT NOT NULL,
      status TEXT NOT NULL,
      admin_reply TEXT,
      replied_at TEXT,
      replied_by TEXT
    );

    CREATE TABLE IF NOT EXISTS customer_notices (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      time TEXT NOT NULL,
      unread INTEGER NOT NULL DEFAULT 1,
      complaint_id TEXT
    );

    CREATE TABLE IF NOT EXISTS platform_users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      scope TEXT NOT NULL,
      status TEXT NOT NULL,
      last_active TEXT NOT NULL
    );
  `);

  // Migrate existing complaints columns if not present
  try { db.exec('ALTER TABLE complaints ADD COLUMN admin_reply TEXT'); } catch {}
  try { db.exec('ALTER TABLE complaints ADD COLUMN replied_at TEXT'); } catch {}
  seedInitialData();

  // Ensure default customer notices exist
  const insertNotice = db.prepare(`
    INSERT OR IGNORE INTO customer_notices (id, kind, title, body, time, unread, complaint_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertNotice.run('CN-4', 'Resolution', 'Complaint CMP-1170 resolved', 'A replacement for the damaged harness box was delivered on 22 Oct.', '22 Oct, 17:30', 0, 'CMP-1170');
  insertNotice.run('CN-3', 'Update', 'ORD-10510 confirmed', 'Expected delivery Tue, 3 Nov between 12 PM and 3 PM.', '27 Oct, 10:01', 0, null);
  insertNotice.run('CN-2', 'Delay notice', 'ORD-10482 is running late', 'Part of your order arrived late at our hub. We are arranging it from another location.', 'Today, 09:42', 1, null);
  insertNotice.run('CN-1', 'ETA change', 'New delivery slot for ORD-10482', 'Your order is now scheduled for Sat, 31 Oct between 10 AM and 1 PM.', 'Today, 10:44', 1, null);
}

export function seedInitialData(force = false) {
  const rowCount = db.prepare('SELECT count(*) as count FROM warehouses').get() as { count: number };
  if (rowCount.count > 0 && !force) {
    return;
  }

  // Clear existing if force
  if (force) {
    db.exec(`
      DELETE FROM workflow_steps;
      DELETE FROM recovery_plans;
      DELETE FROM orders;
      DELETE FROM inventory;
      DELETE FROM shipments;
      DELETE FROM warehouses;
      DELETE FROM suppliers;
      DELETE FROM disruption_alerts;
      DELETE FROM audit_trail;
      DELETE FROM parent_requests;
      DELETE FROM carrier_webhooks;
      DELETE FROM agent_tickets;
      DELETE FROM complaints;
      DELETE FROM platform_users;
    `);
  }

  const insertSupplier = db.prepare(`
    INSERT INTO suppliers (id, code, name, plant_location, performance_score, contact)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertSupplier.run('SUP-01', 'APEX', 'Apex Components Ltd', 'Hosur, Tamil Nadu', 58, 'operations@apexcomp.in');
  insertSupplier.run('SUP-02', 'VTX', 'Vertex Electro Parts', 'Pune, Maharashtra', 91, 'sales@vertexelectro.in');
  insertSupplier.run('SUP-03', 'DEC', 'Deccan Polymers', 'Hyderabad, Telangana', 84, 'support@deccanpoly.in');
  insertSupplier.run('SUP-04', 'NOV', 'Nova Textiles', 'Tiruppur, Tamil Nadu', 76, 'dispatch@novatex.in');
  insertSupplier.run('SUP-05', 'COR', 'Coromandel Metals', 'Hosur, Tamil Nadu', 70, 'info@coromandel.in');

  const insertWarehouse = db.prepare(`
    INSERT INTO warehouses (id, name, city, lat, lng, distance_km, eta, capacity, operator, last_count, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertWarehouse.run('WH-CHN-01', 'Chennai – Ambattur', 'Chennai', 13.1143, 80.1548, 0, 'Origin', 400, 'Suresh Babu', '29 Oct, 10:12', 'Affected');
  insertWarehouse.run('WH-PDY-05', 'Puducherry – Sedarapet', 'Puducherry', 11.9839, 79.7616, 152, '3h 10m', 120, 'Anand Selvam', '28 Oct, 18:40', 'Nearby');
  insertWarehouse.run('WH-BLR-02', 'Bengaluru – Hoskote', 'Bengaluru', 13.0707, 77.7982, 318, '6h 40m', 500, 'Naveen Gowda', '29 Oct, 07:55', 'Transfer source');
  insertWarehouse.run('WH-CBE-04', 'Coimbatore – Kurichi', 'Coimbatore', 10.9601, 76.9558, 505, '9h 05m', 200, 'Deepa Krishnan', '28 Oct, 20:15', 'Nearby');
  insertWarehouse.run('WH-HYD-03', 'Hyderabad – Shamshabad', 'Hyderabad', 17.2403, 78.4294, 627, '11h 20m', 350, 'Lokesh Naidu', '29 Oct, 06:30', 'Affected');

  const insertInventory = db.prepare(`
    INSERT INTO inventory (id, warehouse_id, sku, product_name, on_hand, reserved, safety_stock)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertInventory.run('INV-CHN-01', 'WH-CHN-01', 'ICM-220', 'Industrial Control Module', 35, 0, 40);
  insertInventory.run('INV-BLR-01', 'WH-BLR-02', 'ICM-220', 'Industrial Control Module', 180, 0, 60);
  insertInventory.run('INV-PDY-01', 'WH-PDY-05', 'ICM-220', 'Industrial Control Module', 22, 0, 10);
  insertInventory.run('INV-CBE-01', 'WH-CBE-04', 'ICM-220', 'Industrial Control Module', 40, 0, 15);
  insertInventory.run('INV-HYD-01', 'WH-HYD-03', 'ICM-220', 'Industrial Control Module', 62, 0, 20);

  const insertShipment = db.prepare(`
    INSERT INTO shipments (id, supplier_id, destination_warehouse_id, sku, quantity, mode, status, original_eta, revised_eta, delay_days, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertShipment.run('SHP-7731', 'SUP-01', 'WH-CHN-01', 'ICM-220', 200, 'Road freight', 'Delayed', '29 Oct 2026', '02 Nov 2026', 4, 'Reflow oven stoppage at Hosur line 3');
  insertShipment.run('SHP-7745', 'SUP-04', 'WH-BLR-02', 'FAB-112', 250, 'Express road', 'On track', '30 Oct 2026', '30 Oct 2026', 0, 'Linehaul in transit');
  insertShipment.run('SHP-7722', 'SUP-02', 'WH-CBE-04', 'PSU-48V', 80, 'Road freight', 'In transit', '01 Nov 2026', '01 Nov 2026', 0, 'Cleared Pune checkpoint');

  const insertOrder = db.prepare(`
    INSERT INTO orders (id, customer, area, priority, deadline_hours, deadline_label, quantity, shortage, status, original_eta, revised_eta, explanation, verified_at, lat, lng, factors_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialOrders = [
    {
      id: 'ORD-10482',
      customer: 'Sundaram Motors',
      area: 'Ambattur',
      priority: 'P1',
      deadlineHours: 18,
      deadlineLabel: '30 Oct, 06:00',
      quantity: 40,
      shortage: 40,
      lat: 13.0982,
      lng: 80.1622,
      factors: [
        { label: 'Deadline proximity', points: 33, max: 35, detail: 'Due in 18h – inside the 24h critical window' },
        { label: 'Stock shortage', points: 22, max: 25, detail: '40 of 40 units short (100%)' },
        { label: 'Order priority', points: 20, max: 20, detail: 'P1 – contractual line-stoppage SLA' },
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
      lat: 13.0067,
      lng: 80.2206,
      factors: [
        { label: 'Deadline proximity', points: 30, max: 35, detail: 'Due in 26h – inside the 36h window' },
        { label: 'Stock shortage', points: 19, max: 25, detail: '30 of 30 units short (100%)' },
        { label: 'Order priority', points: 20, max: 20, detail: 'P1 – regulated medical equipment assembly' },
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
      lat: 13.2012,
      lng: 80.3211,
      factors: [
        { label: 'Deadline proximity', points: 27, max: 35, detail: 'Due in 32h – inside 48h critical window' },
        { label: 'Stock shortage', points: 20, max: 25, detail: '25 of 25 units short (100%)' },
        { label: 'Order priority', points: 20, max: 20, detail: 'P1 – government grid power project' },
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
      lat: 12.9815,
      lng: 80.2180,
      factors: [
        { label: 'Deadline proximity', points: 22, max: 35, detail: 'Due in 44h' },
        { label: 'Stock shortage', points: 18, max: 25, detail: '20 of 25 units short (80%)' },
        { label: 'Order priority', points: 14, max: 20, detail: 'P2 – Tier-1 OEM delivery' },
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
      lat: 12.9654,
      lng: 80.2462,
      factors: [
        { label: 'Deadline proximity', points: 18, max: 35, detail: 'Due in 60h' },
        { label: 'Stock shortage', points: 15, max: 25, detail: '15 of 15 units short (100%)' },
        { label: 'Order priority', points: 14, max: 20, detail: 'P2 – automated vehicle plant' },
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
      lat: 13.1122,
      lng: 80.2333,
      factors: [
        { label: 'Deadline proximity', points: 17, max: 35, detail: 'Due in 66h' },
        { label: 'Stock shortage', points: 14, max: 25, detail: '15 of 20 units short (75%)' },
        { label: 'Order priority', points: 14, max: 20, detail: 'P2 – rolling stock retrofitting' },
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
      lat: 12.9688,
      lng: 79.9455,
      factors: [
        { label: 'Deadline proximity', points: 15, max: 35, detail: 'Due in 3 days' },
        { label: 'Stock shortage', points: 12, max: 25, detail: '12 of 18 units short (67%)' },
        { label: 'Order priority', points: 14, max: 20, detail: 'P2 – commercial vehicle chassis' },
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
      lat: 13.0880,
      lng: 80.1650,
      factors: [
        { label: 'Deadline proximity', points: 12, max: 35, detail: 'Due in 3d 12h' },
        { label: 'Stock shortage', points: 9, max: 25, detail: '10 of 12 units short (83%)' },
        { label: 'Order priority', points: 10, max: 20, detail: 'P3 – flexible delivery window' },
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
      lat: 12.8333,
      lng: 79.9500,
      factors: [
        { label: 'Deadline proximity', points: 10, max: 35, detail: 'Due in 4 days' },
        { label: 'Stock shortage', points: 8, max: 25, detail: '8 of 10 units short (80%)' },
        { label: 'Order priority', points: 10, max: 20, detail: 'P3 – transmission subassemblies' },
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
      lat: 13.1667,
      lng: 80.2667,
      factors: [
        { label: 'Deadline proximity', points: 7, max: 35, detail: 'Due in 4d 12h' },
        { label: 'Stock shortage', points: 5, max: 25, detail: '5 of 10 units short (50%)' },
        { label: 'Order priority', points: 10, max: 20, detail: 'P3 – telemetry instruments' },
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
      lat: 13.0012,
      lng: 80.2565,
      factors: [
        { label: 'Deadline proximity', points: 4, max: 35, detail: 'Due in 5d' },
        { label: 'Stock shortage', points: 4, max: 25, detail: '5 of 8 units short (63%)' },
        { label: 'Order priority', points: 2, max: 20, detail: 'P4 – replenishment stock' },
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
      lat: 13.1255,
      lng: 80.2890,
      factors: [
        { label: 'Deadline proximity', points: 2, max: 35, detail: 'Due in 5d 12h' },
        { label: 'Stock shortage', points: 3, max: 25, detail: '4 of 6 units short (67%)' },
        { label: 'Order priority', points: 2, max: 20, detail: 'P4 – buffer inventory' },
        { label: 'Disruption severity', points: 17, max: 20, detail: 'Linked to DIS-2041 classified Major' }
      ]
    }
  ];

  initialOrders.forEach((o) => {
    insertOrder.run(
      o.id,
      o.customer,
      o.area,
      o.priority,
      o.deadlineHours,
      o.deadlineLabel,
      o.quantity,
      o.shortage,
      'Delayed',
      'Thu, 29 Oct – by 6:00 PM',
      'Sat, 31 Oct – 10 AM - 1 PM',
      'Part of your order reached our Chennai hub later than planned. We have arranged replacement stock from another location.',
      'Verified by SwiftLane on 29 Oct, 10:42',
      o.lat,
      o.lng,
      JSON.stringify(o.factors)
    );
  });

  const insertAlert = db.prepare(`
    INSERT INTO disruption_alerts (id, title, source, reference, severity, status, detected, minutes_ago, location, description, suggested, suggestion_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAlert.run(
    'ALT-3108',
    'Supplier delay on SHP-7731 – 200 × ICM-220',
    'Supplier',
    'Apex Components Ltd – SHP-7731',
    'Major',
    'New',
    '29 Oct, 09:18',
    42,
    'Hosur – Chennai',
    'Apex Components Ltd reports a 4-day production stoppage. SHP-7731 dispatch moves from 29 Oct to 2 Nov. Chennai replenishment for ICM-220 depends on this shipment.',
    'Major',
    '120-unit shortage at WH-CHN-01 – 6 orders exposed, 2 Critical'
  );

  insertAlert.run(
    'ALT-3107',
    'Carrier ETA breach on AWB 77812045',
    'Carrier Webhook',
    'BlueDart – AWB 77812045',
    'Moderate',
    'Classified',
    '29 Oct, 08:54',
    66,
    'Bengaluru – Chennai',
    'Webhook event shipment.delayed received. Hub congestion at Hosur adds 9 hours to linehaul.',
    'Moderate',
    '9h delay – 2 P3 orders affected'
  );

  insertAlert.run(
    'ALT-3106',
    'Road closure at Guindy flyover',
    'Agent Ticket',
    'TKT-4469 – Ravi Kumar',
    'Minor',
    'Resolved',
    '29 Oct, 08:27',
    93,
    'Guindy, Chennai',
    'Agent rerouted via Kathipara junction. Auto-resolved under minor-issue procedure MIP-04.',
    'Minor',
    'Delay under 30 min – no orders breached'
  );

  const insertAudit = db.prepare(`
    INSERT INTO audit_trail (id, timestamp, user, role, action, target, reason, before_val, after_val)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAudit.run('AUD-9008', '29 Oct, 10:12', 'Suresh Babu', 'Warehouse Operator', 'Data update', 'WH-CHN-01 – ICM-220', 'Cycle count reconciled with scanner sync', 'On hand: 38', 'On hand: 35');
  insertAudit.run('AUD-9007', '29 Oct, 09:41', 'Priya Raman', 'Operations Analyst', 'Modification', 'ALT-3105', 'QC hold blocks 3 inbound lots for Bengaluru', 'Severity: Unclassified', 'Severity: Major');
  insertAudit.run('AUD-9006', '29 Oct, 09:22', 'Ravi Kumar', 'Delivery Agent', 'Report', 'TKT-4469', 'Road closure at Guindy flyover', null, 'Auto-resolved under MIP-04');

  const insertUser = db.prepare(`
    INSERT INTO platform_users (id, name, email, role, scope, status, last_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('U-001', 'Anita Desai', 'anita.desai@swiftlane.in', 'admin', 'All regions', 'Active', 'Now');
  insertUser.run('U-002', 'Arjun Menon', 'arjun.menon@swiftlane.in', 'scm', 'South region', 'Active', '5m ago');
  insertUser.run('U-003', 'Priya Raman', 'priya.raman@swiftlane.in', 'ops_analyst', 'Chennai desk', 'Active', '12m ago');
  insertUser.run('U-004', 'Kavya Reddy', 'kavya.reddy@swiftlane.in', 'procurement', 'South region', 'Active', '1h ago');
  insertUser.run('U-005', 'Suresh Babu', 'suresh.babu@swiftlane.in', 'warehouse_operator', 'WH-CHN-01', 'Active', '48m ago');
  insertUser.run('U-006', 'Meera Iyer', 'meera.iyer@swiftlane.in', 'partner_admin', 'SwiftLane Logistics', 'Active', 'Now');

  const insertParentReq = db.prepare(`
    INSERT INTO parent_requests (id, type, title, from_org, received, status, priority, linked_case, order_json, shipment_json, products_json, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertParentReq.run(
    'REQ-551',
    'Transfer approval',
    'Transfer 120 × ICM-220 Bengaluru → Chennai',
    'Meera Iyer – SwiftLane Logistics',
    '29 Oct, 10:05',
    'Pending',
    'Critical',
    'RC-2041',
    JSON.stringify({ id: 'ORD-10482', customer: 'Sundaram Motors', deadline: '30 Oct, 06:00', value: '₹9,60,000' }),
    JSON.stringify({ id: 'SHP-7731', origin: 'Hosur', destination: 'Chennai WH-CHN-01', status: 'Delayed 4 days', mode: 'Road freight' }),
    JSON.stringify([
      { sku: 'ICM-220', name: 'Industrial Control Module', requested: 120, onHand: 180, location: 'WH-BLR-02', availability: 'Available' },
      { sku: 'HRN-12', name: 'Control wiring harness', requested: 120, onHand: 74, location: 'WH-BLR-02', availability: 'Partially Available' }
    ]),
    'Bengaluru keeps 60 units for its own committed demand after transfer.'
  );

  const insertComplaint = db.prepare(`
    INSERT INTO complaints (id, order_id, category, description, submitted, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertComplaint.run('CMP-1182', 'ORD-10482', 'Late delivery', 'Production line at Ambattur depends on these modules. Please confirm the new slot is firm.', 'Today, 10:15', 'In review');

  // Seed customer notices if not already present
  const insertNotice = db.prepare(`
    INSERT OR IGNORE INTO customer_notices (id, kind, title, body, time, unread, complaint_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertNotice.run('CN-4', 'Resolution', 'Complaint CMP-1170 resolved', 'A replacement for the damaged harness box was delivered on 22 Oct.', '22 Oct, 17:30', 0, 'CMP-1170');
  insertNotice.run('CN-3', 'Update', 'ORD-10510 confirmed', 'Expected delivery Tue, 3 Nov between 12 PM and 3 PM.', '27 Oct, 10:01', 0, null);
  insertNotice.run('CN-2', 'Delay notice', 'ORD-10482 is running late', 'Part of your order arrived late at our hub. We are arranging it from another location.', 'Today, 09:42', 1, null);
  insertNotice.run('CN-1', 'ETA change', 'New delivery slot for ORD-10482', 'Your order is now scheduled for Sat, 31 Oct between 10 AM and 1 PM.', 'Today, 10:44', 1, null);
}

// Initialize immediately upon import
initDatabase();
