import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { Shield, Plus, Pencil, UserCheck } from 'lucide-react';
import { api } from '../../api/client';

type Role = { id: number; name: string; description: string | null; hierarchyLevel: number };

type UserItem = {
  id: string;
  email: string;
  roleId: number;
  roleName: string;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
};

type EmployeeOption = {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  displayName: string;
};

const ROLE_SIDEBAR_DESC: Record<string, string> = {
  super_admin: 'Full access + API Manager',
  hr_admin: 'HR: sidebar access controlled by Super Admin (Permission Management below)',
  manager: 'Limited (team views)',
  employee: 'Minimal (self only)',
};

type ScopeNode = { id: string; label: string; children?: ScopeNode[] };
type ScopePermission = { scopeId: string; canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean };

function flattenScopes(nodes: ScopeNode[], out: ScopeNode[]): void {
  for (const n of nodes) {
    out.push(n);
    if (n.children?.length) flattenScopes(n.children, out);
  }
}

export function PermissionsPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRoleId, setEditRoleId] = useState<number | ''>('');
  const [createEmployee, setCreateEmployee] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRoleId, setCreateRoleId] = useState<number | ''>('');

  const { data: roles } = useQuery({
    queryKey: ['settings-users-roles'],
    queryFn: () =>
      api.get<{ success: true; data: Role[] }>('/settings/users/roles').then((r) => r.data),
  });
  const roleList = roles ?? [];

  const { data: users, isLoading } = useQuery({
    queryKey: ['settings-users'],
    queryFn: () =>
      api.get<{ success: true; data: UserItem[] }>('/settings/users').then((r) => r.data),
  });
  const userList = users ?? [];

  const { data: employeesWithoutUser } = useQuery({
    queryKey: ['settings-users-employees-without'],
    queryFn: () =>
      api
        .get<{ success: true; data: EmployeeOption[] }>('/settings/users/employees-without-user')
        .then((r) => r.data),
    enabled: showCreate,
  });
  const employeeOptions = employeesWithoutUser ?? [];

  const createMutation = useMutation({
    mutationFn: (body: { employeeId: string; email: string; password: string; roleId: number }) =>
      api.post<{ success: true; data: UserItem; message: string }>('/settings/users', body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-users'] });
      queryClient.invalidateQueries({ queryKey: ['settings-users-employees-without'] });
      setShowCreate(false);
      setCreateEmployee('');
      setCreateEmail('');
      setCreatePassword('');
      setCreateRoleId('');
      toast.success('User created. They can log in with the email and password.');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, roleId }: { id: string; roleId: number }) =>
      api.put<{ success: true; data: UserItem; message: string }>(`/settings/users/${id}`, { roleId }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-users'] });
      setEditingId(null);
      setEditRoleId('');
      toast.success('Role updated. Sidebar access will apply on next login.');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function openEdit(u: UserItem) {
    setEditingId(u.id);
    setEditRoleId(u.roleId);
  }

  function handleCreate() {
    if (!createEmployee || !createEmail.trim() || !createPassword || createRoleId === '') {
      toast.error('Select employee, enter email, password and role');
      return;
    }
    if (createPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    createMutation.mutate({
      employeeId: createEmployee,
      email: createEmail.trim(),
      password: createPassword,
      roleId: createRoleId as number,
    });
  }

  function handleUpdate(id: string) {
    if (editRoleId === '') return;
    updateMutation.mutate({ id, roleId: editRoleId as number });
  }

  // --- Permission Management (Super Admin only: grant HR users access to modules/submodules) ---
  const [selectedHrUserId, setSelectedHrUserId] = useState<string>('');
  const [permissionDraft, setPermissionDraft] = useState<Record<string, ScopePermission>>({});

  const hrUsers = userList.filter((u) => u.roleName === 'hr_admin');

  const { data: scopesTree } = useQuery({
    queryKey: ['settings-permissions-scopes'],
    queryFn: () =>
      api.get<{ success: true; data: ScopeNode[] }>('/settings/permissions/scopes').then((r) => r.data),
  });
  const tree = scopesTree ?? [];

  const { data: userPerms, isLoading: permsLoading } = useQuery({
    queryKey: ['settings-permissions-user', selectedHrUserId],
    queryFn: () =>
      api.get<{ success: true; data: ScopePermission[] }>(`/settings/permissions/user?userId=${encodeURIComponent(selectedHrUserId)}`).then((r) => r.data),
    enabled: !!selectedHrUserId,
  });

  // Sync draft from server when user or data changes
  useEffect(() => {
    const flat: ScopeNode[] = [];
    flattenScopes(tree, flat);
    if (flat.length === 0) return;
    const defaultPerms: Record<string, ScopePermission> = {};
    flat.forEach((s) => {
      defaultPerms[s.id] = {
        scopeId: s.id,
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
      };
    });
    if (userPerms?.length) {
      userPerms.forEach((p) => {
        if (defaultPerms[p.scopeId]) defaultPerms[p.scopeId] = p;
      });
    }
    setPermissionDraft(defaultPerms);
  }, [selectedHrUserId, userPerms, tree]);

  const savePermissionsMutation = useMutation({
    mutationFn: (body: { userId: string; permissions: ScopePermission[] }) =>
      api.put<{ success: true; message: string }>('/settings/permissions/user', body).then((r) => r.data),
    onSuccess: () => {
      toast.success('Permissions saved. Changes apply on next login or refresh.');
      queryClient.invalidateQueries({ queryKey: ['settings-permissions-user', selectedHrUserId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function setDraftVisible(scopeId: string, visible: boolean) {
    setPermissionDraft((prev) => ({
      ...prev,
      [scopeId]: {
        ...prev[scopeId],
        scopeId,
        canView: visible,
        canCreate: false,
        canEdit: false,
        canDelete: false,
      },
    }));
  }

  function handleSavePermissions() {
    if (!selectedHrUserId) {
      toast.error('Select an HR user');
      return;
    }
    const flat: ScopeNode[] = [];
    flattenScopes(tree, flat);
    const permissions = flat.map((s) => {
      const p = permissionDraft[s.id] ?? { scopeId: s.id, canView: false, canCreate: false, canEdit: false, canDelete: false };
      return {
        scopeId: s.id,
        canView: Boolean(p.canView),
        canCreate: false,
        canEdit: false,
        canDelete: false,
      };
    });
    savePermissionsMutation.mutate({ userId: selectedHrUserId, permissions });
  }

  function renderScopeRow(node: ScopeNode, depth: number) {
    const p = permissionDraft[node.id] ?? {
      scopeId: node.id,
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    };
    return (
      <div key={node.id} className="flex items-center gap-4 py-2 border-b border-gray-100 dark:border-dark-border last:border-0" style={{ paddingLeft: depth * 16 }}>
        <span className="flex-1 min-w-0 text-sm font-medium text-gray-900 dark:text-dark-text truncate" title={node.id}>
          {node.label}
        </span>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-dark-textSecondary shrink-0 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(p.canView)}
            onChange={(e) => setDraftVisible(node.id, e.target.checked)}
            className="rounded border-gray-300 dark:border-dark-border text-light-primary dark:text-dark-primary focus:ring-light-primary dark:focus:ring-dark-primary"
          />
          Show in sidebar
        </label>
      </div>
    );
  }

  function renderScopeTree(nodes: ScopeNode[], depth: number): React.ReactNode {
    return nodes.map((node) => (
      <div key={node.id}>
        {renderScopeRow(node, depth)}
        {node.children?.length ? renderScopeTree(node.children, depth + 1) : null}
      </div>
    ));
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-2 flex items-center gap-2">
        <Shield className="w-7 h-7" />
        Permissions
      </h1>
      <p className="text-gray-600 dark:text-dark-textSecondary mb-6">
        Add employees with login and set their role. Role controls sidebar access (e.g. HR roles get full sidebar).
      </p>

      <div className="mb-6 p-4 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
        <h2 className="font-semibold text-gray-900 dark:text-dark-text mb-2">Role → Sidebar access</h2>
        <ul className="text-sm text-gray-600 dark:text-dark-textSecondary space-y-1">
          {Object.entries(ROLE_SIDEBAR_DESC).map(([role, desc]) => (
            <li key={role}>
              <span className="font-medium text-gray-700 dark:text-dark-textSecondary">{role}</span>: {desc}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text">Users with access</h2>
        <button
          type="button"
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white text-sm font-medium hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          Add employee access
        </button>
      </div>

      {showCreate && (
        <div className="mb-6 p-4 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card">
          <h3 className="font-medium text-gray-900 dark:text-dark-text mb-3 flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Create new user (login for employee)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-sm text-gray-600 dark:text-dark-textSecondary mb-1">Employee</label>
              <select
                value={createEmployee}
                onChange={(e) => {
                  setCreateEmployee(e.target.value);
                  const emp = employeeOptions.find((x) => x.employeeCode === e.target.value);
                  if (emp) setCreateEmail(emp.email || '');
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
              >
                <option value="">Select employee</option>
                {employeeOptions.map((e) => (
                  <option key={e.employeeCode} value={e.employeeCode}>
                    {e.displayName}
                  </option>
                ))}
              </select>
              {employeeOptions.length === 0 && !createEmployee && (
                <p className="text-xs text-gray-500 mt-1">All active employees already have a login.</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-dark-textSecondary mb-1">Email (login)</label>
              <input
                type="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                placeholder="email@company.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-dark-textSecondary mb-1">Password</label>
              <input
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-dark-textSecondary mb-1">Role (sidebar access)</label>
              <select
                value={createRoleId}
                onChange={(e) => setCreateRoleId(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
              >
                <option value="">Select role</option>
                {roleList.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              Create user
            </button>
            <button
              type="button"
              onClick={() => { setShowCreate(false); setCreateEmployee(''); setCreateEmail(''); setCreatePassword(''); setCreateRoleId(''); }}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-border text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
        {isLoading && <div className="p-6 text-gray-500 dark:text-dark-textSecondary">Loading…</div>}
        {!isLoading && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-dark-bg border-b border-gray-200 dark:border-dark-border">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-dark-textSecondary">Employee</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-dark-textSecondary">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-dark-textSecondary">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-dark-textSecondary">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-dark-textSecondary">Last login</th>
                  <th className="w-0 py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {userList.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100 dark:border-dark-border last:border-0 hover:bg-gray-50 dark:hover:bg-dark-bg/50">
                    <td className="py-3 px-4">
                      <span className="font-medium">{u.employeeName}</span>
                      <span className="text-gray-500 dark:text-dark-textSecondary block text-xs">{u.employeeCode}</span>
                    </td>
                    <td className="py-3 px-4">{u.email}</td>
                    <td className="py-3 px-4">
                      {editingId === u.id ? (
                        <select
                          value={editRoleId}
                          onChange={(e) => setEditRoleId(e.target.value === '' ? '' : Number(e.target.value))}
                          className="px-2 py-1 border border-gray-300 dark:border-dark-border rounded text-sm"
                        >
                          {roleList.map((r) => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium">
                          {u.roleName}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={u.isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 dark:text-dark-textSecondary">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}
                    </td>
                    <td className="py-3 px-4">
                      {editingId === u.id ? (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdate(u.id)}
                            disabled={updateMutation.isPending}
                            className="text-sm text-green-600 dark:text-green-400 hover:underline"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => { setEditingId(null); setEditRoleId(''); }}
                            className="text-sm text-gray-500 hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openEdit(u)}
                          className="p-1.5 rounded text-gray-600 dark:text-dark-textSecondary hover:bg-gray-100 dark:hover:bg-dark-bg"
                          title="Edit role"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && userList.length === 0 && (
          <div className="p-8 text-center text-gray-500 dark:text-dark-textSecondary">
            No users yet. Add employee access above.
          </div>
        )}
      </div>

      {/* Sidebar visibility: Super Admin chooses which tabs/subtabs each HR user can see */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-2">Sidebar access for HR users</h2>
        <p className="text-sm text-gray-600 dark:text-dark-textSecondary mb-4">
          Choose which sidebar tabs and subtabs this HR user can see. This only controls visibility of menu items—not data permissions. New HR users see no tabs until you assign access. Changes apply on next login or refresh.
        </p>
        <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-dark-border">
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-textSecondary mb-2">HR User</label>
            <select
              value={selectedHrUserId}
              onChange={(e) => setSelectedHrUserId(e.target.value)}
              className="w-full max-w-md px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-sm"
            >
              <option value="">Select HR user…</option>
              {hrUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.employeeName} ({u.email})
                </option>
              ))}
            </select>
            {hrUsers.length === 0 && (
              <p className="text-xs text-gray-500 dark:text-dark-textSecondary mt-1">No HR users. Create a user and set role to hr_admin above.</p>
            )}
          </div>
          {selectedHrUserId && (
            <>
              <div className="p-4 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
                <div className="flex items-center gap-4 text-xs font-medium text-gray-600 dark:text-dark-textSecondary">
                  <span className="flex-1">Tab / Subtab</span>
                  <span className="shrink-0">Show in sidebar</span>
                </div>
              </div>
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                {permsLoading ? (
                  <p className="text-gray-500 dark:text-dark-textSecondary text-sm">Loading…</p>
                ) : (
                  renderScopeTree(tree, 0)
                )}
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-dark-border">
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  disabled={savePermissionsMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-light-primary dark:bg-dark-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  Save sidebar access
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
