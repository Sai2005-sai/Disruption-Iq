import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LockIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../contexts/AppContext';
import { allowedRolesFor, roleMeta } from '../../utils/roles';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';

export function RestrictedState({ path }: {path: string;}) {
  const { role } = useApp();
  const navigate = useNavigate();
  const allowed = allowedRolesFor(path) ?? [];
  const suggested = allowed.find((r) => r !== 'admin') ?? allowed[0];

  return (
    <Card className="mx-auto mt-6 max-w-xl">
      <EmptyState
        icon={LockIcon}
        title={`Not available to ${roleMeta[role].label}`}
        body={`This screen is limited to: ${allowed.map((r) => roleMeta[r].label).join(', ')}. Role-based access is enforced on every screen and action.`}
        action={
        <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => navigate(roleMeta[role]?.home || '/')}>
              Go to my home
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                navigate('/login');
              }}>
              Switch account
            </Button>
          </div>
        } />
      
    </Card>);

}