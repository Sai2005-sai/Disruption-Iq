import React, { useState } from 'react';
import { SearchIcon, UserPlusIcon, LockIcon } from 'lucide-react';
import { toast } from 'sonner';
import { platformUsers, permissions, matrixRoles, defaultMatrix } from '../../data/users';
import { PlatformUser, Role } from '../../types/domain';
import { useApp } from '../../contexts/AppContext';
import { roleMeta } from '../../utils/roles';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusChip, Tone } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Field, inputClass } from '../ui/Field';

const statusTone: Record<PlatformUser['status'], Tone> = { Active: 'success', Invited: 'info', Suspended: 'neutral' };

export function UsersRoles() {
  const { logAudit } = useApp();
  const [users, setUsers] = useState(platformUsers);
  const [query, setQuery] = useState('');
  const [matrix, setMatrix] = useState<Record<string, Role[]>>(defaultMatrix);
  const [saved, setSaved] = useState<Record<string, Role[]>>(defaultMatrix);
  const [invite, setInvite] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'ops_analyst' as Role });
  const [formError, setFormError] = useState('');

  const dirty = JSON.stringify(matrix) !== JSON.stringify(saved);
  const filtered = users.filter((u) => `${u.name} ${u.email} ${roleMeta[u.role].label}`.toLowerCase().includes(query.toLowerCase()));

  const toggle = (perm: string, role: Role) =>
  setMatrix((m) => {
    const has = m[perm].includes(role);
    return { ...m, [perm]: has ? m[perm].filter((r) => r !== role) : [...m[perm], role] };
  });

  const save = () => {
    const changes = permissions.filter((p) => JSON.stringify([...matrix[p]].sort()) !== JSON.stringify([...saved[p]].sort()));
    changes.forEach((p) =>
    logAudit({
      action: 'Data update',
      target: `Permission · ${p}`,
      reason: 'Permission matrix updated',
      before: saved[p].map((r) => roleMeta[r].short).join(', ') || 'None',
      after: matrix[p].map((r) => roleMeta[r].short).join(', ') || 'None'
    })
    );
    setSaved(matrix);
    toast.success('Permissions saved', { description: `${changes.length} permission${changes.length === 1 ? '' : 's'} changed` });
  };

  const sendInvite = () => {
    if (form.name.trim().length < 3 || !/^\S+@\S+\.\S+$/.test(form.email)) return setFormError('Enter a full name and a valid email.');
    const u: PlatformUser = { id: `U-0${users.length + 1}`, name: form.name.trim(), email: form.email.trim(), role: form.role, scope: 'Chennai desk', status: 'Invited', lastActive: '—' };
    setUsers((list) => [...list, u]);
    logAudit({ action: 'Data update', target: `User · ${u.name}`, reason: 'User invited', after: `Role: ${roleMeta[u.role].label}` });
    toast.success(`Invite sent to ${u.email}`);
    setInvite(false);
    setForm({ name: '', email: '', role: 'ops_analyst' });
    setFormError('');
  };

  return (
    <div className="space-y-6">
      <Card as="section">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative sm:w-72">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users" className={`${inputClass} pl-9`} aria-label="Search users" />
          </div>
          <Button icon={<UserPlusIcon className="h-4 w-4" />} onClick={() => setInvite(true)}>
            Invite user
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Scope</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Last active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((u) =>
              <tr key={u.id}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-ink-2">
                        {u.name.
                      split(' ').
                      map((p) => p[0]).
                      join('')}
                      </span>
                      <span>
                        <span className="block font-medium text-ink">{u.name}</span>
                        <span className="block text-xs text-muted">{u.email}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-2">{roleMeta[u.role].label}</td>
                  <td className="px-4 py-3 text-ink-2">{u.scope}</td>
                  <td className="px-4 py-3">
                    <StatusChip tone={statusTone[u.status]}>{u.status}</StatusChip>
                  </td>
                  <td className="px-5 py-3 text-right text-muted">{u.lastActive}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card as="section">
        <CardHeader
          title="Permission matrix"
          description="Approvers can never approve plans they created — enforced regardless of this matrix"
          action={
          dirty ?
          <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setMatrix(saved)}>
                  Reset
                </Button>
                <Button size="sm" onClick={save}>
                  Save changes
                </Button>
              </div> :

          <span className="text-xs text-muted">All changes saved</span>

          } />
        
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-y border-line text-xs text-muted">
                <th className="px-5 py-3 text-left font-medium">Permission</th>
                {matrixRoles.map((r) =>
                <th key={r} className="px-3 py-3 text-center font-medium">
                    {roleMeta[r].label}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {permissions.map((p) =>
              <tr key={p}>
                  <th scope="row" className="px-5 py-3 text-left font-normal text-ink">
                    {p}
                  </th>
                  {matrixRoles.map((r) => {
                  const locked = p === 'Manage users & roles' && r === 'admin';
                  return (
                    <td key={r} className="px-3 py-3 text-center">
                        {locked ?
                      <LockIcon className="mx-auto h-4 w-4 text-muted" aria-label="Always granted to Administrator" /> :

                      <input
                        type="checkbox"
                        checked={matrix[p].includes(r)}
                        onChange={() => toggle(p, r)}
                        aria-label={`${p} for ${roleMeta[r].label}`}
                        className="h-4 w-4 cursor-pointer rounded border-line accent-teal-600" />

                      }
                      </td>);

                })}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={invite}
        onClose={() => setInvite(false)}
        title="Invite user"
        footer={
        <>
            <Button variant="secondary" onClick={() => setInvite(false)}>
              Cancel
            </Button>
            <Button onClick={sendInvite}>Send invite</Button>
          </>
        }>
        
        <div className="space-y-4">
          <Field label="Full name" htmlFor="inv-name" required>
            <input id="inv-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Work email" htmlFor="inv-email" required>
            <input id="inv-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Role" htmlFor="inv-role" error={formError}>
            <select id="inv-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })} className={inputClass}>
              {matrixRoles.map((r) =>
              <option key={r} value={r}>
                  {roleMeta[r].label}
                </option>
              )}
            </select>
          </Field>
        </div>
      </Modal>
    </div>);

}