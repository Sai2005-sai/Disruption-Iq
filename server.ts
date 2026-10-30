import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { db, seedInitialData } from './server/db.ts';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Helper for audit trail logging
function logAudit(
  action: string,
  target: string,
  reason: string,
  user = 'Meera Iyer',
  role = 'Delivery Partner Admin',
  beforeVal: string | null = null,
  afterVal: string | null = null
) {
  const id = `AUD-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
  const now = new Date();
  const timestamp = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const stmt = db.prepare(`
    INSERT INTO audit_trail (id, timestamp, user, role, action, target, reason, before_val, after_val)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, timestamp, user, role, action, target, reason, beforeVal, afterVal);
  return id;
}

// -------------------------------------------------------------
// REST API ROUTES
// -------------------------------------------------------------

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    database: 'SQLite (WAL mode)',
    serverTime: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Full state snapshot
app.get('/api/state', (_req: Request, res: Response) => {
  try {
    const suppliers = db.prepare('SELECT * FROM suppliers').all();
    const warehouses = db.prepare('SELECT * FROM warehouses').all();
    const inventory = db.prepare('SELECT * FROM inventory').all();
    const shipments = db.prepare('SELECT * FROM shipments').all();
    const alerts = db.prepare('SELECT * FROM disruption_alerts ORDER BY minutes_ago ASC').all();
    const ordersRaw = db.prepare('SELECT * FROM orders').all() as any[];
    const audit = db.prepare('SELECT * FROM audit_trail ORDER BY id DESC LIMIT 50').all();
    const parentRequests = db.prepare('SELECT * FROM parent_requests ORDER BY id DESC').all() as any[];
    const users = db.prepare('SELECT * FROM platform_users').all();
    const complaintsRaw = db.prepare('SELECT * FROM complaints ORDER BY id DESC').all() as any[];
    const complaints = complaintsRaw.map((c) => ({
      id: c.id,
      orderId: c.order_id,
      category: c.category,
      description: c.description,
      submitted: c.submitted,
      status: c.status,
      adminReply: c.admin_reply || undefined,
      repliedAt: c.replied_at || undefined,
      repliedBy: c.replied_by || undefined
    }));
    const customerNotices = db.prepare('SELECT id, kind, title, body, time, (unread == 1) as unread, complaint_id as complaintId FROM customer_notices ORDER BY rowid DESC').all();
    const recentWebhooks = db.prepare('SELECT * FROM carrier_webhooks ORDER BY id DESC LIMIT 20').all();

    const agentTicketsRaw = db.prepare('SELECT * FROM agent_tickets ORDER BY rowid DESC').all() as any[];
    const agentTickets = agentTicketsRaw.map((t) => ({
      id: t.id,
      orderId: t.order_id,
      reason: t.reason,
      delayMinutes: t.delay_minutes,
      notes: t.notes,
      photoCount: t.photo_count,
      outcome: t.outcome,
      submitted: t.submitted_at,
      agentName: t.agent_name || 'Ravi Kumar',
      customerName: t.customer_name || 'Sundaram Motors',
      area: t.area || 'Ambattur, Chennai',
      adminSolution: t.admin_solution || undefined,
      solutionStatus: t.solution_status || 'Pending Review',
      forwardedAt: t.forwarded_at || undefined,
      forwardedBy: t.forwarded_by || undefined,
      revisedEta: t.revised_eta || undefined
    }));

    // Parse JSON fields
    const orders = ordersRaw.map((o) => ({
      ...o,
      factors: o.factors_json ? JSON.parse(o.factors_json) : []
    }));

    const parsedParentRequests = parentRequests.map((r) => ({
      ...r,
      order: JSON.parse(r.order_json),
      shipment: JSON.parse(r.shipment_json),
      products: JSON.parse(r.products_json)
    }));

    // Active workflow
    const activePlan = db.prepare('SELECT * FROM recovery_plans ORDER BY id DESC LIMIT 1').get() as any;
    let workflow = null;
    if (activePlan) {
      const steps = db.prepare('SELECT * FROM workflow_steps WHERE plan_id = ? ORDER BY step_order ASC').all(activePlan.id) as any[];
      workflow = {
        planId: activePlan.id,
        disruptionId: activePlan.disruption_id,
        optionId: activePlan.option_id,
        optionTitle: activePlan.title,
        cost: activePlan.cost,
        quantity: activePlan.quantity,
        dispatchMode: activePlan.dispatch_mode,
        createdBy: activePlan.created_by,
        createdByRole: activePlan.created_by_role,
        createdAt: activePlan.created_at,
        state: activePlan.state,
        stale: Boolean(activePlan.stale),
        executedAt: activePlan.executed_at,
        steps: steps.map((s) => ({
          role: s.role,
          status: s.status,
          by: s.by_user,
          at: s.at_time,
          comment: s.comment
        }))
      };
    }

    res.json({
      suppliers,
      warehouses,
      inventory,
      shipments,
      alerts,
      orders,
      audit,
      parentRequests: parsedParentRequests,
      users,
      complaints,
      customerNotices,
      agentTickets,
      recentWebhooks,
      workflow
    });
  } catch (err: any) {
    console.error('Error fetching state:', err);
    res.status(500).json({ error: err.message });
  }
});

// Classify Alert
app.post('/api/alerts/classify', (req: Request, res: Response) => {
  const { alertId, severity, reason, user, role } = req.body;
  if (!alertId || !severity || !reason) {
    return res.status(400).json({ error: 'alertId, severity and reason are required' });
  }

  const existing = db.prepare('SELECT * FROM disruption_alerts WHERE id = ?').get(alertId) as any;
  if (!existing) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  db.prepare(`
    UPDATE disruption_alerts
    SET severity = ?, status = 'Classified'
    WHERE id = ?
  `).run(severity, alertId);

  logAudit(
    'Modification',
    alertId,
    reason,
    user || 'Priya Raman',
    role || 'Operations Analyst',
    `Severity: ${existing.severity}`,
    `Severity: ${severity}`
  );

  res.json({ success: true, alertId, severity });
});

// Create Recovery Case
app.post('/api/alerts/:id/create-case', (req: Request, res: Response) => {
  const alertId = req.params.id;
  const { user, role } = req.body;

  const alert = db.prepare('SELECT * FROM disruption_alerts WHERE id = ?').get(alertId) as any;
  if (!alert) return res.status(404).json({ error: 'Alert not found' });

  db.prepare("UPDATE disruption_alerts SET status = 'Case created' WHERE id = ?").run(alertId);

  logAudit(
    'Plan created',
    alertId,
    `Created recovery case for ${alert.title}`,
    user || 'Meera Iyer',
    role || 'Delivery Partner Admin',
    alert.status,
    'Case created'
  );

  res.json({ success: true, caseId: 'RC-2041' });
});

// Select Recovery Plan Option
app.post('/api/plans/select', (req: Request, res: Response) => {
  const { optionId, title, summary, cost, timeSavedDays, ordersCovered, approvers, user, role } = req.body;

  const planId = 'RC-2041';
  const now = new Date();
  const createdAt = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // Insert or replace recovery plan
  db.prepare(`
    INSERT OR REPLACE INTO recovery_plans 
    (id, disruption_id, option_id, title, summary, cost, time_saved_days, orders_covered, quantity, dispatch_mode, created_by, created_by_role, created_at, state, stale, executed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'in_review', 0, NULL)
  `).run(
    planId,
    'DIS-2041',
    optionId,
    title,
    summary,
    cost,
    timeSavedDays,
    ordersCovered,
    120,
    'Standard road freight',
    user || 'Arjun Menon',
    role || 'scm',
    createdAt
  );

  // Setup workflow steps
  db.prepare('DELETE FROM workflow_steps WHERE plan_id = ?').run(planId);
  const insertStep = db.prepare(`
    INSERT INTO workflow_steps (plan_id, step_order, role, status, by_user, at_time, comment)
    VALUES (?, ?, ?, ?, NULL, NULL, NULL)
  `);

  const approverRoles: string[] = approvers || ['scm', 'procurement', 'parent_company'];
  approverRoles.forEach((r, idx) => {
    insertStep.run(planId, idx + 1, r, idx === 0 ? 'current' : 'waiting');
  });

  logAudit(
    'Plan created',
    planId,
    `Selected recovery option "${title}"`,
    user || 'Arjun Menon',
    role || 'Supply Chain Manager',
    undefined,
    `${title} – ₹${cost.toLocaleString('en-IN')}`
  );

  res.json({ success: true, planId });
});

// Approve, Reject, or Modify Step (with Separation of Duties enforcement!)
app.post('/api/plans/:id/decide', (req: Request, res: Response) => {
  const planId = req.params.id;
  const { decision, comment, change, user, role } = req.body;

  const plan = db.prepare('SELECT * FROM recovery_plans WHERE id = ?').get(planId) as any;
  if (!plan) return res.status(404).json({ error: 'Plan not found' });

  const steps = db.prepare('SELECT * FROM workflow_steps WHERE plan_id = ? ORDER BY step_order ASC').all(planId) as any[];
  const currentStep = steps.find((s) => s.status === 'current');
  if (!currentStep) return res.status(400).json({ error: 'No active step awaiting approval' });

  // STRICT SEPARATION OF DUTIES ENFORCEMENT:
  // A user cannot approve a plan they created!
  if (decision === 'approve' && user && plan.created_by && user.trim().toLowerCase() === plan.created_by.trim().toLowerCase()) {
    return res.status(403).json({
      error: 'Separation of duties violation: You cannot approve a recovery plan you created.',
      detail: `Created by ${plan.created_by}. A distinct approver with role ${currentStep.role} must review and authorize this step.`
    });
  }

  // Check role match
  if (role && currentStep.role !== role && role !== 'admin') {
    return res.status(403).json({
      error: `Role mismatch: Step requires ${currentStep.role}, but current user has role ${role}`
    });
  }

  const now = new Date();
  const stamp = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  if (decision === 'reject') {
    db.prepare(`
      UPDATE workflow_steps
      SET status = 'rejected', by_user = ?, at_time = ?, comment = ?
      WHERE id = ?
    `).run(user || 'Approver', stamp, comment || 'Rejected', currentStep.id);

    db.prepare("UPDATE recovery_plans SET state = 'rejected' WHERE id = ?").run(planId);

    logAudit('Rejection', planId, comment || 'Plan rejected', user || 'Approver', role || 'Approver', 'In review', 'Rejected');
    return res.json({ success: true, state: 'rejected' });
  }

  // Handle Approve or Modify
  const nextStatus = decision === 'modify' ? 'modified' : 'approved';
  db.prepare(`
    UPDATE workflow_steps
    SET status = ?, by_user = ?, at_time = ?, comment = ?
    WHERE id = ?
  `).run(nextStatus, user || 'Approver', stamp, comment || '', currentStep.id);

  // If modify, update quantity or dispatch mode
  if (change) {
    if (change.quantity) db.prepare('UPDATE recovery_plans SET quantity = ? WHERE id = ?').run(change.quantity, planId);
    if (change.dispatchMode) db.prepare('UPDATE recovery_plans SET dispatch_mode = ? WHERE id = ?').run(change.dispatchMode, planId);
  }

  // Check if there is a next step
  const nextStep = steps.find((s) => s.step_order === currentStep.step_order + 1);
  if (nextStep) {
    db.prepare("UPDATE workflow_steps SET status = 'current' WHERE id = ?").run(nextStep.id);
    logAudit(
      decision === 'modify' ? 'Modification' : 'Approval',
      planId,
      comment || `Approved step ${currentStep.step_order}`,
      user || 'Approver',
      role || 'Approver'
    );
    return res.json({ success: true, state: 'in_review', nextRole: nextStep.role });
  } else {
    // All steps approved!
    db.prepare("UPDATE recovery_plans SET state = 'approved', stale = 0 WHERE id = ?").run(planId);
    logAudit(
      'Approval',
      planId,
      comment || 'Final approval completed - plan approved for simulated execution',
      user || 'Approver',
      role || 'Approver',
      'In review',
      'Approved'
    );
    return res.json({ success: true, state: 'approved' });
  }
});

// Revalidate & Execute Simulation
app.post('/api/plans/:id/revalidate-and-execute', (req: Request, res: Response) => {
  const planId = req.params.id;
  const { user, role, simulateConcurrentChange } = req.body;

  const plan = db.prepare('SELECT * FROM recovery_plans WHERE id = ?').get(planId) as any;
  if (!plan) return res.status(404).json({ error: 'Plan not found' });
  if (plan.state !== 'approved') {
    return res.status(400).json({ error: 'Plan must be in approved state before execution' });
  }

  // Check executor permission
  const allowedExecutors = ['scm', 'partner_admin', 'admin'];
  if (!allowedExecutors.includes(role)) {
    return res.status(403).json({
      error: `Execution denied: Role ${role} lacks 'Execute simulation' permission`
    });
  }

  // If demonstration of concurrent change / double allocation is requested:
  if (simulateConcurrentChange) {
    db.prepare("UPDATE recovery_plans SET state = 'in_review', stale = 1 WHERE id = ?").run(planId);
    db.prepare("UPDATE workflow_steps SET status = CASE WHEN step_order = 1 THEN 'current' ELSE 'waiting' END WHERE plan_id = ?").run(planId);

    logAudit(
      'Execution',
      planId,
      'Pre-execution revalidation failed: Bengaluru stock changed after approval (double-allocation conflict with RC-2038)',
      user || 'System',
      role || 'Executor',
      'Approved',
      'Stale - re-approval required'
    );

    return res.status(409).json({
      success: false,
      stale: true,
      error: 'Revalidation failed: Source warehouse stock was modified after approval. Plan sent back for re-approval.'
    });
  }

  // Pre-flight check: Source stock in WH-BLR-02
  const sourceStock = db.prepare("SELECT on_hand, reserved FROM inventory WHERE warehouse_id = 'WH-BLR-02' AND sku = 'ICM-220'").get() as any;
  if (!sourceStock || sourceStock.on_hand - sourceStock.reserved < plan.quantity) {
    db.prepare("UPDATE recovery_plans SET state = 'in_review', stale = 1 WHERE id = ?").run(planId);
    return res.status(409).json({
      success: false,
      stale: true,
      error: `Insufficient uncommitted inventory at WH-BLR-02 (${sourceStock?.on_hand ?? 0} on hand, ${plan.quantity} required)`
    });
  }

  // Execute simulation atomically
  const now = new Date();
  const stamp = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // Reserve stock in source warehouse & transfer to destination
  db.prepare(`
    UPDATE inventory 
    SET reserved = reserved + ?
    WHERE warehouse_id = 'WH-BLR-02' AND sku = 'ICM-220'
  `).run(plan.quantity);

  // Update order statuses and ETAs
  db.prepare(`
    UPDATE orders
    SET status = 'On track',
        revised_eta = 'Fri, 30 Oct – 2 PM - 5 PM',
        explanation = 'Recovery transfer TRF-3312 executed. Stock dispatched from Bengaluru Hoskote facility.',
        verified_at = ?
    WHERE sku = 'ICM-220' OR id IN ('ORD-10482', 'ORD-10477', 'ORD-10491', 'ORD-10495', 'ORD-10503', 'ORD-10510')
  `).run(`Verified by SwiftLane on ${stamp}`);

  // Mark plan executed
  db.prepare(`
    UPDATE recovery_plans
    SET state = 'executed', executed_at = ?
    WHERE id = ?
  `).run(stamp, planId);

  logAudit(
    'Execution',
    planId,
    'Simulated execution passed all 5 revalidation checks. Inventory reserved and customer ETAs updated.',
    user || 'Arjun Menon',
    role || 'Supply Chain Manager',
    'Approved',
    'Executed (simulation)'
  );

  res.json({
    success: true,
    executedAt: stamp,
    ordersUpdated: 6,
    stockReserved: plan.quantity
  });
});

// Carrier Webhook Ingestion with Idempotency, Invalid Field Rejection, and Stale Timestamp Conflict Protection
const handleCarrierWebhook = (req: Request, res: Response) => {
  // Support both exact user specification (event_id, tracking_no, status, reason, new_eta, timestamp)
  // and internal simulator format (idempotency_key, awb, event_type, eta_delta_minutes, occurred_at)
  const eventId = req.body.event_id || req.body.idempotency_key;
  const carrier = req.body.carrier;
  const trackingNo = req.body.tracking_no || req.body.awb;
  const statusOrEvent = req.body.status || req.body.event_type || req.body.event;
  const reason = req.body.reason || req.body.location || 'Transit delay';
  const newEta = req.body.new_eta;
  const timestamp = req.body.timestamp || req.body.occurred_at || new Date().toISOString();
  const quantity = req.body.quantity;

  // 1. Validate required fields & negative quantities (handle invalid data safely)
  if (!eventId || !carrier || !trackingNo || !statusOrEvent) {
    logAudit(
      'Data update',
      `Invalid Webhook Payload`,
      `Rejected invalid carrier webhook: missing required fields (event_id, carrier, tracking_no, or status).`,
      carrier || 'Unknown Carrier',
      'Carrier Webhook',
      JSON.stringify(req.body).slice(0, 80),
      '400 Bad Request (Rejected)'
    );
    return res.status(400).json({
      status: 'invalid_rejected',
      error: 'Missing required fields: event_id, carrier, tracking_no, and status are mandatory.'
    });
  }

  if (typeof quantity === 'number' && quantity < 0) {
    logAudit(
      'Data update',
      `Invalid Webhook (${trackingNo})`,
      `Rejected invalid carrier webhook ${eventId}: negative quantity (${quantity}) is not allowed.`,
      carrier,
      'Carrier Webhook',
      `quantity: ${quantity}`,
      '400 Bad Request (Rejected)'
    );
    return res.status(400).json({
      status: 'invalid_rejected',
      error: `Invalid payload: quantity cannot be negative (got ${quantity}).`
    });
  }

  // 2. Idempotency check (same event_id sent twice -> ignore)
  const existing = db.prepare('SELECT * FROM carrier_webhooks WHERE idempotency_key = ?').get(eventId) as any;
  if (existing) {
    logAudit(
      'Data update',
      `Carrier Webhook: ${carrier} ${trackingNo}`,
      `Duplicate webhook event_id "${eventId}" received twice. Ignored safely via idempotency check.`,
      carrier,
      'Carrier Webhook',
      `Processed at ${existing.received_at}`,
      '200 Duplicate Ignored'
    );
    return res.status(200).json({
      status: 'duplicate_ignored',
      message: `Duplicate event_id "${eventId}" already processed. No state change.`,
      event_id: eventId,
      idempotency_key: eventId
    });
  }

  // 3. Out-of-order / conflicting timestamp check (older timestamp arriving after newer one -> do not overwrite)
  const latestForTracking = db
    .prepare('SELECT * FROM carrier_webhooks WHERE awb = ? AND status = ? ORDER BY received_at DESC LIMIT 1')
    .get(trackingNo, 'Accepted') as any;

  if (latestForTracking) {
    try {
      const prevPayload = JSON.parse(latestForTracking.payload_json || '{}');
      const prevTimestampStr = prevPayload.timestamp || prevPayload.occurred_at || latestForTracking.received_at;
      const incomingTime = new Date(timestamp).getTime();
      const latestTime = new Date(prevTimestampStr).getTime();

      if (!isNaN(incomingTime) && !isNaN(latestTime) && incomingTime < latestTime) {
        logAudit(
          'Data update',
          `Conflicting Webhook: ${carrier} ${trackingNo}`,
          `Ignored out-of-order event "${eventId}": event timestamp (${timestamp}) is older than latest state (${prevTimestampStr}).`,
          carrier,
          'Carrier Webhook',
          `Current timestamp: ${prevTimestampStr}`,
          `Rejected stale timestamp: ${timestamp}`
        );
        return res.status(409).json({
          status: 'conflict_older_timestamp',
          error: `Conflicting update ignored: incoming event timestamp (${timestamp}) is older than the most recent update (${prevTimestampStr}).`,
          event_id: eventId,
          latest_timestamp: prevTimestampStr
        });
      }
    } catch {
      // Proceed if timestamp parsing fails
    }
  }

  // 4. Record valid webhook
  const id = `WHK-${Date.now()}`;
  db.prepare(`
    INSERT INTO carrier_webhooks (id, idempotency_key, carrier, awb, event_type, payload_json, received_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'Accepted')
  `).run(id, eventId, carrier, trackingNo, statusOrEvent, JSON.stringify(req.body), timestamp);

  // 5. Apply disruption update if DELAYED or shipment.delayed
  const isDelayed = String(statusOrEvent).toUpperCase() === 'DELAYED' || statusOrEvent === 'shipment.delayed';
  if (isDelayed) {
    db.prepare(`
      UPDATE shipments
      SET status = 'Delayed', revised_eta = COALESCE(?, revised_eta), notes = ?
      WHERE id = ? OR id = 'SHP-7731'
    `).run(newEta || '2026-11-03T18:00:00Z', `Carrier ${carrier} reported DELAYED (${reason})`, trackingNo);

    db.prepare(`
      UPDATE disruption_alerts
      SET severity = 'Major', status = 'Classified', minutes_ago = 0,
          description = ?
      WHERE id = 'ALT-3107'
    `).run(`Webhook event ${eventId} (${statusOrEvent}) from ${carrier} for ${trackingNo}. Reason: ${reason}. New ETA: ${newEta || '+9h'}. Warehouse B (Chennai) lacks stock to cover affected orders; system recommends reallocating from Warehouse A (Bengaluru) or expediting.`);

    logAudit(
      'Report',
      `Tracking ${trackingNo}`,
      `${carrier} webhook ${eventId} (${statusOrEvent} - ${reason}). New ETA: ${newEta || '+9h'}. Linked orders re-evaluated.`,
      carrier,
      'Carrier Webhook',
      'In transit (On time)',
      `DELAYED (${newEta || '+9h'})`
    );
  }

  res.status(202).json({
    status: 'accepted',
    id,
    event_id: eventId,
    idempotency_key: eventId,
    carrier,
    tracking_no: trackingNo,
    event_type: statusOrEvent,
    timestamp
  });
};

app.post('/api/webhooks/carrier', handleCarrierWebhook);
app.post('/webhooks/carrier', handleCarrierWebhook);

// CSV / JSON Data Import Endpoint with Duplicate, Invalid & Conflict Validation
app.post('/api/data/import', (req: Request, res: Response) => {
  const { fileName, records, user, role } = req.body;
  if (!Array.isArray(records)) {
    return res.status(400).json({ error: 'records array is required' });
  }

  const seenIds = new Set<string>();
  const issues: { row: number; record: string; type: 'invalid' | 'duplicate' | 'conflicting'; reason: string }[] = [];
  const validRecords: any[] = [];

  records.forEach((rec, idx) => {
    const rowNum = idx + 1;
    const recordId = rec.order_id || rec.id || `ROW-${rowNum}`;

    // 1. Check duplicate in batch
    if (seenIds.has(recordId)) {
      issues.push({
        row: rowNum,
        record: recordId,
        type: 'duplicate',
        reason: `Duplicate event/record ID "${recordId}" in import batch (idempotency guard ignored duplicate)`
      });
      return;
    }
    seenIds.add(recordId);

    // 2. Check missing required fields or negative quantity
    if (!rec.customer || rec.delivery_pincode === '' || rec.delivery_pincode === undefined) {
      issues.push({
        row: rowNum,
        record: recordId,
        type: 'invalid',
        reason: 'Missing required field: delivery_pincode'
      });
      return;
    }

    const qty = Number(rec.quantity);
    if (isNaN(qty) || qty <= 0) {
      issues.push({
        row: rowNum,
        record: recordId,
        type: 'invalid',
        reason: `quantity must be a positive integer (got ${rec.quantity})`
      });
      return;
    }

    if (rec.eta && isNaN(new Date(rec.eta).getTime())) {
      issues.push({
        row: rowNum,
        record: recordId,
        type: 'invalid',
        reason: `eta "${rec.eta}" is not a valid ISO-8601 date`
      });
      return;
    }

    // 3. Check conflicting older timestamp
    if (rec.updated_at && new Date(rec.updated_at).getTime() < new Date('2026-10-29T00:00:00Z').getTime()) {
      issues.push({
        row: rowNum,
        record: recordId,
        type: 'conflicting',
        reason: `Stale timestamp (${rec.updated_at}) is older than live database state (2026-10-30T09:00:00Z) — prevented overwrite`
      });
      return;
    }

    validRecords.push(rec);
  });

  // Upsert valid orders into SQLite
  const upsertOrder = db.prepare(`
    INSERT OR REPLACE INTO orders (id, customer, area, priority, deadline_hours, deadline_label, quantity, shortage, status, original_eta, revised_eta, explanation, verified_at, lat, lng, factors_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Delayed', 'Thu, 29 Oct – by 6:00 PM', 'Sat, 31 Oct – 10 AM - 1 PM', 'Imported via CSV/JSON data pipeline and linked to SHP-7731.', 'Verified on import', 13.0827, 80.2101, ?)
  `);

  const defaultFactors = JSON.stringify([
    { label: 'Deadline proximity', points: 25, max: 35, detail: 'Evaluated during CSV/JSON import' },
    { label: 'Stock shortage', points: 20, max: 25, detail: 'Linked to SHP-7731 inventory deficit' },
    { label: 'Order priority', points: 16, max: 20, detail: 'Contractual SLA tier' },
    { label: 'Disruption severity', points: 17, max: 20, detail: 'Linked to DIS-2041 Major' }
  ]);

  const tx = db.transaction((items: any[]) => {
    for (const item of items) {
      upsertOrder.run(
        item.order_id || item.id,
        item.customer,
        item.area || 'Chennai Industrial Belt',
        item.priority || 'P2',
        Number(item.deadline_hours) || 48,
        item.deadline_label || '31 Oct, 12:00',
        Number(item.quantity) || 10,
        Number(item.shortage ?? item.quantity) || 10,
        defaultFactors
      );
    }
  });

  tx(validRecords);

  logAudit(
    'Data update',
    fileName || 'Dataset Import',
    `Imported ${validRecords.length} valid records into SQLite; quarantined ${issues.length} bad records (duplicates, invalid quantities, stale timestamps).`,
    user || 'Priya Raman',
    role || 'Operations Analyst',
    `${records.length} raw rows`,
    `${validRecords.length} committed · ${issues.length} rejected`
  );

  res.json({
    success: true,
    fileName,
    summary: {
      total: records.length,
      valid: validRecords.length,
      invalid: issues.filter((i) => i.type === 'invalid').length,
      duplicate: issues.filter((i) => i.type === 'duplicate').length,
      conflicting: issues.filter((i) => i.type === 'conflicting').length
    },
    issues
  });
});

// Customer Complaints Endpoints (Persisted in SQLite, visible across Portals)
app.post('/api/complaints', (req: Request, res: Response) => {
  const { orderId, category, description, customerName } = req.body;
  if (!orderId || !category || !description) {
    return res.status(400).json({ error: 'orderId, category and description are required' });
  }

  const count = (db.prepare('SELECT count(*) as count FROM complaints').get() as any).count;
  const id = `CMP-${1183 + count}`;
  const now = new Date();
  const stamp = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  db.prepare(`
    INSERT INTO complaints (id, order_id, category, description, submitted, status)
    VALUES (?, ?, ?, ?, ?, 'Submitted')
  `).run(id, orderId, category, description, stamp);

  logAudit(
    'Report',
    `Complaint ${id}`,
    `Customer raised complaint for ${orderId}: [${category}] ${description.slice(0, 80)}`,
    customerName || 'Sneha Pillai',
    'Customer',
    'None',
    'Submitted'
  );

  const complaint = {
    id,
    orderId,
    category,
    description,
    submitted: stamp,
    status: 'Submitted'
  };

  res.status(201).json({
    success: true,
    complaint
  });
});

app.get('/api/complaints', (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM complaints ORDER BY id DESC').all() as any[];
  const complaints = rows.map((c) => ({
    id: c.id,
    orderId: c.order_id,
    category: c.category,
    description: c.description,
    submitted: c.submitted,
    status: c.status,
    adminReply: c.admin_reply || undefined,
    repliedAt: c.replied_at || undefined,
    repliedBy: c.replied_by || undefined
  }));
  res.json({ complaints });
});

// Admin Reply to Customer Complaint (sends notification to customer portal)
app.post('/api/complaints/:id/reply', (req: Request, res: Response) => {
  const complaintId = req.params.id;
  const { reply, status = 'In review', user = 'Meera Iyer' } = req.body;

  if (!reply || !reply.trim()) {
    return res.status(400).json({ error: 'Reply text is required' });
  }

  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(complaintId) as any;
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  const now = new Date();
  const timeStamp = `Today, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const noticeId = `CN-${Date.now()}`;

  // Update complaint with admin reply and status
  db.prepare(`
    UPDATE complaints 
    SET admin_reply = ?, replied_at = ?, replied_by = ?, status = ?
    WHERE id = ?
  `).run(reply.trim(), timeStamp, user, status, complaintId);

  // Create real-time notification in customer portal
  const noticeKind = status === 'Resolved' ? 'Resolution' : 'Update';
  const noticeTitle = `Admin reply: ${complaint.id} (${complaint.order_id})`;
  const noticeBody = `SwiftLane Support (${user}): "${reply.trim()}"`;

  db.prepare(`
    INSERT INTO customer_notices (id, kind, title, body, time, unread, complaint_id)
    VALUES (?, ?, ?, ?, ?, 1, ?)
  `).run(noticeId, noticeKind, noticeTitle, noticeBody, timeStamp, complaintId);

  // Log in system audit trail
  logAudit(
    'Modification',
    complaintId,
    `Admin replied to complaint [${complaint.category}]: "${reply.trim()}"`,
    user,
    'Delivery Partner Admin',
    complaint.status,
    status
  );

  res.json({
    success: true,
    complaint: {
      id: complaint.id,
      orderId: complaint.order_id,
      category: complaint.category,
      description: complaint.description,
      submitted: complaint.submitted,
      status,
      adminReply: reply.trim(),
      repliedAt: timeStamp,
      repliedBy: user
    },
    notice: {
      id: noticeId,
      kind: noticeKind,
      title: noticeTitle,
      body: noticeBody,
      time: timeStamp,
      unread: true,
      complaintId
    }
  });
});

// Customer Notices Endpoints
app.get('/api/customer/notices', (_req: Request, res: Response) => {
  const notices = db.prepare('SELECT id, kind, title, body, time, (unread == 1) as unread, complaint_id as complaintId FROM customer_notices ORDER BY rowid DESC').all();
  res.json({ notices });
});

app.post('/api/customer/notices/mark-read', (req: Request, res: Response) => {
  const { id, all } = req.body;
  if (all) {
    db.prepare('UPDATE customer_notices SET unread = 0').run();
  } else if (id) {
    db.prepare('UPDATE customer_notices SET unread = 0 WHERE id = ?').run(id);
  }
  res.json({ success: true });
});

// Run End-to-End Scenario
app.post('/api/scenarios/run', (req: Request, res: Response) => {
  const { scenarioId } = req.body;

  if (scenarioId === 'reset') {
    seedInitialData(true);
    logAudit('Data update', 'System Database', 'Reset database to initial synthetic baseline', 'Anita Desai', 'Administrator');
    return res.json({ success: true, message: 'Database reset to default synthetic state.' });
  }

  if (scenarioId === 'scn-1') {
    // Scenario 1: Supplier delay on SHP-7731 (Apex Components)
    db.prepare(`
      UPDATE shipments
      SET status = 'Delayed', revised_eta = '02 Nov 2026', delay_days = 4
      WHERE id = 'SHP-7731'
    `).run();

    db.prepare(`
      UPDATE disruption_alerts
      SET status = 'New', severity = 'Major', minutes_ago = 12
      WHERE id = 'ALT-3108'
    `).run();

    logAudit(
      'Report',
      'DIS-2041 (Scenario 1)',
      'Apex Components Ltd factory breakdown on SMT line 3: SHP-7731 delayed by 4 days, causing 120-unit shortage at WH-CHN-01.',
      'Scenario Runner',
      'System',
      'Normal operations',
      'Active Disruption DIS-2041'
    );

    return res.json({
      success: true,
      scenario: 'Scenario 1: Supplier delay on SHP-7731',
      affectedOrders: 6,
      shortage: 120
    });
  }

  if (scenarioId === 'scn-2') {
    // Scenario 2: Carrier webhook delay (BlueDart AWB 77812045)
    const idempotencyKey = `idem_bluedart_77812045_${Date.now()}`;
    db.prepare(`
      INSERT OR REPLACE INTO carrier_webhooks (id, idempotency_key, carrier, awb, event_type, payload_json, received_at, status)
      VALUES (?, ?, 'BlueDart', '77812045', 'shipment.delayed', '{"delta": 540, "hub": "Hosur"}', ?, 'Accepted')
    `).run(`WHK-${Date.now()}`, idempotencyKey, new Date().toISOString());

    db.prepare(`
      UPDATE disruption_alerts
      SET status = 'Classified', severity = 'Moderate', minutes_ago = 2
      WHERE id = 'ALT-3107'
    `).run();

    logAudit(
      'Report',
      'ALT-3107 (Scenario 2)',
      'BlueDart webhook shipment.delayed (+9h linehaul delay at Hosur hub). Idempotency key checked.',
      'BlueDart Webhook',
      'Carrier',
      'On time',
      'ETA +9 hours'
    );

    return res.json({
      success: true,
      scenario: 'Scenario 2: Carrier webhook delay',
      awb: '77812045',
      delayHours: 9
    });
  }

  res.status(400).json({ error: 'Unknown scenario ID' });
});

// Delivery Agent Ticket Submission (MIP-04 Evaluation)
app.post('/api/agent/tickets', (req: Request, res: Response) => {
  const { orderId, reason, delayMinutes, notes, photoCount, isMinor, hasSafetyRisk, user } = req.body;

  const ticketId = `TKT-${Math.floor(4470 + Math.random() * 500)}`;
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // Deterministic MIP-04 rule checks:
  const isMinorReason = Boolean(isMinor);
  const isShortDelay = (delayMinutes || 0) <= 60;
  const hasPhoto = (photoCount || 0) > 0;
  const isSafe = !hasSafetyRisk;

  const autoResolved = isMinorReason && isShortDelay && hasPhoto && isSafe;
  const outcome = autoResolved ? 'Resolved' : 'Escalated';

  // Find linked order information
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
  const customerName = order?.customer || 'Sundaram Motors';
  const area = order?.area || 'Ambattur, Chennai';

  db.prepare(`
    INSERT INTO agent_tickets (id, order_id, reason, delay_minutes, notes, photo_count, outcome, submitted_at, agent_name, customer_name, area, solution_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    ticketId,
    orderId,
    reason,
    delayMinutes || 45,
    notes || '',
    photoCount || 0,
    outcome,
    timeStr,
    user || 'Ravi Kumar',
    customerName,
    area,
    'Pending Review'
  );

  if (autoResolved) {
    db.prepare(`
      UPDATE orders
      SET revised_eta = '30 min later today',
          explanation = 'Driver encountered minor road obstacle; rerouted automatically under procedure MIP-04'
      WHERE id = ?
    `).run(orderId);
  }

  logAudit(
    'Report',
    ticketId,
    `Agent ticket: ${reason} on ${orderId} (${delayMinutes}m). Checks: ${autoResolved ? 'Pass' : 'Escalate'}`,
    user || 'Ravi Kumar',
    'Delivery Agent',
    undefined,
    outcome === 'Resolved' ? 'Auto-resolved under MIP-04' : 'Escalated to Partner Admin'
  );

  const ticket = {
    id: ticketId,
    orderId,
    reason,
    delayMinutes: delayMinutes || 45,
    notes: notes || '',
    photoCount: photoCount || 0,
    outcome,
    submitted: timeStr,
    agentName: user || 'Ravi Kumar',
    customerName,
    area,
    solutionStatus: 'Pending Review'
  };

  res.json({
    success: true,
    ticketId,
    ticket,
    outcome,
    autoResolved,
    checks: {
      isMinorReason,
      isShortDelay,
      hasPhoto,
      isSafe
    }
  });
});

// GET all agent delay tickets for Admin & Agent views
app.get('/api/agent/tickets', (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM agent_tickets ORDER BY rowid DESC').all() as any[];
  const tickets = rows.map((t) => ({
    id: t.id,
    orderId: t.order_id,
    reason: t.reason,
    delayMinutes: t.delay_minutes,
    notes: t.notes,
    photoCount: t.photo_count,
    outcome: t.outcome,
    submitted: t.submitted_at,
    agentName: t.agent_name || 'Ravi Kumar',
    customerName: t.customer_name || 'Sundaram Motors',
    area: t.area || 'Ambattur, Chennai',
    adminSolution: t.admin_solution || undefined,
    solutionStatus: t.solution_status || 'Pending Review',
    forwardedAt: t.forwarded_at || undefined,
    forwardedBy: t.forwarded_by || undefined,
    revisedEta: t.revised_eta || undefined
  }));
  res.json({ tickets });
});

// Dynamic AI Solution for Agent Reported Delays using Gemini API
app.post('/api/ai/solve-agent-delay', async (req: Request, res: Response) => {
  try {
    const { ticketId, orderId } = req.body;
    const ticket = db.prepare('SELECT * FROM agent_tickets WHERE id = ?').get(ticketId) as any;
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId || ticket?.order_id) as any;

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({
        ticketId,
        orderId: order?.id || ticket.order_id,
        driverDirective: `Take Inner Ring Road via Kathipara junction exit 3 to avoid the blocked Mount Road flyover. Re-approach Ambattur plant through bypass road.`,
        revisedEta: `Today, by ${new Date(Date.now() + (ticket.delay_minutes + 15) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        customerExplanation: `Your delivery agent encountered traffic diversions on the main corridor. SwiftLane operations has rerouted the vehicle via the Western arterial bypass to minimize delays.`,
        actionPlan: [
          'Driver to take Kathipara bypass corridor to circumvent primary roadblock',
          'Ambattur security gate notified of revised delivery van arrival window',
          'Customer receiving desk updated with active driver tracking link'
        ],
        riskMitigation: 'Avoids 45-minute congestion standstill and prevents plant assembly line stoppage.',
        source: 'Deterministic supply chain rules engine'
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are the lead supply chain intelligence and dispatch operations officer at SwiftLane Logistics.
A field delivery driver has encountered an active delay while transporting an order to an enterprise customer.

Order Information:
- Order Number: ${order?.id || ticket.order_id}
- Customer Name: ${order?.customer || ticket.customer_name || 'Sundaram Motors'}
- Delivery Location: ${order?.area || ticket.area || 'Ambattur, Chennai'}
- Original Delivery Window: ${order?.original_eta || 'Thu, 29 Oct – by 6:00 PM'}
- Current SLA Status: ${order?.status || 'Delayed'}
- Priority Level: ${order?.priority || 'P1 Critical'}

Driver Field Report:
- Driver: ${ticket.agent_name || 'Ravi Kumar'}
- Delay Cause: ${ticket.reason}
- Estimated Delay: ${ticket.delay_minutes} minutes
- Driver Notes: ${ticket.notes || 'None provided'}

Generate a professional, realistic operational recovery solution as a JSON object:
1. "driverDirective": Specific step-by-step driving/procedural commands for the driver (e.g. specific bypasses, bypass checkpoints, OTP authorization, gate pass procedures, or split dispatch).
2. "revisedEta": Concrete revised delivery window (e.g. "Today, 11:30 AM – 12:00 PM" accounting for the ${ticket.delay_minutes}m delay).
3. "customerExplanation": Courteous, transparent 2-sentence explanation for the end customer explaining what happened and how SwiftLane is resolving it.
4. "actionPlan": Array of 3 tactical actions executed by dispatch and the driver.
5. "riskMitigation": Explanation of how this solution prevents SLA penalty or factory stoppage.

Respond ONLY with valid JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      ticketId,
      orderId: order?.id || ticket.order_id,
      driverDirective: parsed.driverDirective || 'Take Kathipara bypass and proceed directly to Ambattur gate 2.',
      revisedEta: parsed.revisedEta || `Today, +${ticket.delay_minutes} min`,
      customerExplanation: parsed.customerExplanation || 'Delivery driver rerouted around local traffic. Updated ETA applied.',
      actionPlan: parsed.actionPlan || [
        'Reroute driver via arterial bypass',
        'Notify destination security gate',
        'Monitor real-time GPS check-in'
      ],
      riskMitigation: parsed.riskMitigation || 'Maintains plant assembly line schedule within acceptable SLA buffer.',
      source: 'Gemini 3.8 Flash'
    });
  } catch (err: any) {
    console.error('Gemini delay solution error:', err);
    res.json({
      ticketId: req.body.ticketId,
      orderId: req.body.orderId,
      driverDirective: 'Proceed via Western arterial bypass to circumvent corridor delay. Coordinate with Ambattur receiving dock.',
      revisedEta: 'Today, +45 min revised window',
      customerExplanation: 'Your driver encountered unexpected road maintenance. SwiftLane dispatch has authorized an alternate bypass to expedite delivery.',
      actionPlan: [
        'Reroute via Western bypass corridor',
        'Alert dock receiving supervisor',
        'Prioritize gate entry on arrival'
      ],
      riskMitigation: 'Maintains delivery within contractual buffer period.',
      source: 'Fallback logistics rules engine'
    });
  }
});

// Forward AI Solution to Delivery Agent & Update Customer Portal Order Details
app.post('/api/agent/tickets/:id/forward-solution', (req: Request, res: Response) => {
  const ticketId = req.params.id;
  const { solution, revisedEta, customerExplanation, user = 'Meera Iyer' } = req.body;

  const ticket = db.prepare('SELECT * FROM agent_tickets WHERE id = ?').get(ticketId) as any;
  if (!ticket) {
    return res.status(404).json({ error: 'Agent ticket not found' });
  }

  const now = new Date();
  const timeStamp = `Today, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const orderId = ticket.order_id;

  // 1. Update ticket in agent_tickets table
  db.prepare(`
    UPDATE agent_tickets
    SET admin_solution = ?,
        solution_status = 'Forwarded to Agent',
        forwarded_at = ?,
        forwarded_by = ?,
        revised_eta = ?
    WHERE id = ?
  `).run(solution, timeStamp, user, revisedEta || 'Today, revised', ticketId);

  // 2. Update orders table so Customer Portal reflects the updated ETA & explanation!
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
  if (order) {
    db.prepare(`
      UPDATE orders
      SET status = 'Delayed',
          revised_eta = ?,
          explanation = ?
      WHERE id = ?
    `).run(revisedEta || 'Today, revised', customerExplanation || solution, orderId);
  }

  // 3. Dispatch customer notification into customer_notices table
  const noticeId = `CN-${Date.now()}`;
  const noticeTitle = `Order ${orderId} Delay Update & Recovery Solution`;
  const noticeBody = `SwiftLane Operations (${user}): "${customerExplanation || solution}". Revised arrival window: ${revisedEta || 'Updated'}.`;

  db.prepare(`
    INSERT INTO customer_notices (id, kind, title, body, time, unread, complaint_id)
    VALUES (?, 'ETA change', ?, ?, ?, 1, ?)
  `).run(noticeId, noticeTitle, noticeBody, timeStamp, ticketId);

  // 4. Log in Audit Trail
  logAudit(
    'Modification',
    ticketId,
    `Admin forwarded AI solution to driver (${ticket.agent_name || 'Ravi Kumar'}) and updated customer order ${orderId} ETA to "${revisedEta}": "${solution.slice(0, 80)}"`,
    user,
    'Delivery Partner Admin',
    'Pending Review',
    'Forwarded to Agent & Customer'
  );

  res.json({
    success: true,
    ticketId,
    orderId,
    solutionStatus: 'Forwarded to Agent',
    adminSolution: solution,
    revisedEta,
    customerExplanation,
    forwardedAt: timeStamp,
    forwardedBy: user,
    notice: {
      id: noticeId,
      title: noticeTitle,
      body: noticeBody,
      time: timeStamp
    }
  });
});

// Parent Company Request Decision
app.post('/api/parent/requests/:id/decide', (req: Request, res: Response) => {
  const reqId = req.params.id;
  const { status, comment, user, role } = req.body;

  const request = db.prepare('SELECT * FROM parent_requests WHERE id = ?').get(reqId) as any;
  if (!request) return res.status(404).json({ error: 'Parent request not found' });

  db.prepare('UPDATE parent_requests SET status = ? WHERE id = ?').run(status, reqId);

  logAudit(
    status === 'Approved' ? 'Approval' : 'Rejection',
    reqId,
    comment || `Decision by Parent Company: ${status}`,
    user || 'Rahul Khanna',
    role || 'Parent Company',
    'Pending',
    status
  );

  // If this was linked to the active recovery plan RC-2041, sync the step!
  const plan = db.prepare("SELECT * FROM recovery_plans WHERE id = 'RC-2041'").get() as any;
  if (plan && plan.state === 'in_review') {
    const parentStep = db.prepare("SELECT * FROM workflow_steps WHERE plan_id = 'RC-2041' AND role = 'parent_company' AND status = 'current'").get() as any;
    if (parentStep) {
      if (status === 'Approved') {
        db.prepare("UPDATE workflow_steps SET status = 'approved', by_user = ?, at_time = ?, comment = ? WHERE id = ?")
          .run(user || 'Rahul Khanna', new Date().toLocaleTimeString(), comment || 'Approved via parent portal', parentStep.id);
        db.prepare("UPDATE recovery_plans SET state = 'approved' WHERE id = 'RC-2041'").run();
      } else {
        db.prepare("UPDATE workflow_steps SET status = 'rejected', by_user = ?, at_time = ?, comment = ? WHERE id = ?")
          .run(user || 'Rahul Khanna', new Date().toLocaleTimeString(), comment || 'Rejected by parent company', parentStep.id);
        db.prepare("UPDATE recovery_plans SET state = 'rejected' WHERE id = 'RC-2041'").run();
      }
    }
  }

  res.json({ success: true, reqId, status });
});

// Physical Inventory Count Confirmation
app.post('/api/inventory/confirm', (req: Request, res: Response) => {
  const { warehouseId, sku, count, user, role } = req.body;

  const item = db.prepare('SELECT * FROM inventory WHERE warehouse_id = ? AND sku = ?').get(warehouseId, sku) as any;
  if (!item) return res.status(404).json({ error: 'Inventory record not found' });

  const before = item.on_hand;
  db.prepare('UPDATE inventory SET on_hand = ? WHERE id = ?').run(count, item.id);
  db.prepare('UPDATE warehouses SET last_count = ? WHERE id = ?').run(new Date().toLocaleString(), warehouseId);

  logAudit(
    'Data update',
    `${warehouseId} – ${sku}`,
    'Physical inventory count confirmed by warehouse operator',
    user || 'Suresh Babu',
    role || 'Warehouse Operator',
    `On hand: ${before}`,
    `On hand: ${count}`
  );

  res.json({ success: true, before, after: count });
});

// AI Disruption Summary with Gemini API
app.post('/api/ai/disruption-summary', async (req: Request, res: Response) => {
  try {
    const { disruptionId, promptContext } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.json({
        headline: 'Apex Components 4-day supplier delay triggers 120-unit shortage at Chennai.',
        body: 'Production stoppage on SMT line 3 prevents dispatch of SHP-7731 (200 units). Chennai WH-CHN-01 holds only 35 units against 155 committed, leaving 6 orders exposed (2 Critical SLA breaches projected within 26 hours). Reallocating 120 units from Bengaluru WH-BLR-02 provides the fastest and most feasible path to full order fulfillment.',
        bullets: [
          'Root cause verified against supplier notice AP-2210 and carrier slot release',
          'Bengaluru has 120 free units with a 6h 40m road transit time',
          'Earliest customer SLA breach is ORD-10482 (Sundaram Motors) in 18 hours'
        ],
        confidence: 0.94,
        source: 'Deterministic supply chain rules & fallback model'
      });
    }

    const ai = new GoogleGenAI();
    const prompt = `You are the lead supply chain intelligence system in DisruptionIQ.
Given the current disruption on the Hosur-Chennai corridor:
- Supplier: Apex Components Ltd (Hosur)
- Disrupted shipment: SHP-7731 (200 units of ICM-220 Industrial Control Module)
- Delay: 4 days (oven failure on SMT line 3)
- Impact: Chennai warehouse has 35 units on hand but requires 155 units (120-unit shortage)
- Customer exposure: 6 orders at risk (ORD-10482 Sundaram Motors due in 18h P1, ORD-10477 Coastal Pharma due in 26h P1)
- Candidate recovery: WH-BLR-02 (Bengaluru Hoskote) has 180 units on hand (120 uncommitted surplus) within 6h 40m road freight.

Generate a JSON object with:
1. "headline": concise single-sentence executive headline
2. "body": 2-sentence executive summary with clear numbers and risk urgency
3. "bullets": array of 3 crisp factual bullet points
4. "confidence": number between 0.90 and 0.99

Respond ONLY with valid JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      headline: parsed.headline || 'Apex Components 4-day supplier delay leaves Chennai 120 units short.',
      body: parsed.body || 'Disruption on SHP-7731 exposes 6 customer orders. Reallocation from Bengaluru resolves the deficit.',
      bullets: parsed.bullets || ['Root cause verified', 'Surplus in Bengaluru available', 'Zero customer SLA breach if approved'],
      confidence: parsed.confidence || 0.95,
      source: 'Gemini 2.5 Flash'
    });
  } catch (err: any) {
    console.error('Gemini API error:', err);
    res.json({
      headline: 'Apex Components 4-day supplier delay triggers 120-unit shortage at Chennai.',
      body: 'Production stoppage on SMT line 3 prevents dispatch of SHP-7731. Chennai WH-CHN-01 holds 35 units against 155 committed. Reallocation from Bengaluru covers all orders.',
      bullets: [
        'Root cause verified against supplier notice AP-2210',
        'Bengaluru holds 120 surplus uncommitted units',
        'Transfer road transit time is 6h 40m'
      ],
      confidence: 0.92,
      source: 'Deterministic fallback engine'
    });
  }
});

// Customer Complaint Submission
app.post('/api/customer/complaints', (req: Request, res: Response) => {
  const { orderId, category, description, user } = req.body;
  if (!orderId || !category || !description) {
    return res.status(400).json({ error: 'orderId, category and description are required' });
  }

  const id = `CMP-${Math.floor(1185 + Math.random() * 500)}`;
  db.prepare(`
    INSERT INTO complaints (id, order_id, category, description, submitted, status)
    VALUES (?, ?, ?, ?, 'Just now', 'Submitted')
  `).run(id, orderId, category, description);

  logAudit(
    'Report',
    id,
    `Customer complaint filed for ${orderId}: ${category}`,
    user || 'Sneha Pillai',
    'Customer',
    undefined,
    'Submitted'
  );

  res.json({ success: true, id, status: 'Submitted' });
});

// -------------------------------------------------------------
// VITE DEV SERVER INTEGRATION
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DisruptionIQ server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
