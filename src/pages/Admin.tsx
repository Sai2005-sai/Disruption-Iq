import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { platformUsers } from '../data/users';
import { PageHeader } from '../components/ui/PageHeader';
import { Tabs } from '../components/ui/Tabs';
import { UsersRoles } from '../components/admin/UsersRoles';
import { AuditTrail } from '../components/admin/AuditTrail';
import { DataQuality } from '../components/admin/DataQuality';
import { AdminComplaints } from '../components/admin/AdminComplaints';
import { AdminAgentDelays } from '../components/admin/AdminAgentDelays';

export function Admin() {
  const [params, setParams] = useSearchParams();
  const { audit, complaints, agentTickets } = useApp();
  const tab = params.get('tab') ?? 'agent-delays';

  return (
    <>
      <PageHeader
        title="Administration &amp; Escalations"
        description="Solve driver-reported order delays with dynamic Gemini AI, respond to customer complaints, oversee platform users, and review audit trails."
      />
      <Tabs
        className="mb-6"
        value={tab}
        onChange={(id) => setParams({ tab: id })}
        tabs={[
          { id: 'agent-delays', label: 'Driver Reported Delays & AI', count: agentTickets.length },
          { id: 'complaints', label: 'Customer Complaints & Escalations', count: complaints.length },
          { id: 'audit', label: 'Audit trail', count: audit.length },
          { id: 'users', label: 'Users & roles', count: platformUsers.length },
          { id: 'quality', label: 'Data quality' }
        ]}
      />

      {tab === 'agent-delays' && <AdminAgentDelays />}
      {tab === 'complaints' && <AdminComplaints />}
      {tab === 'audit' && <AuditTrail />}
      {tab === 'users' && <UsersRoles />}
      {tab === 'quality' && <DataQuality />}
    </>
  );
}