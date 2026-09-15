import { useCallback, useEffect, useState } from 'react';
import { Api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { debounce, initials, timeAgo } from '../lib/format.js';
import { PermissionGate } from '../components/guards.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import FormField, { SelectField } from '../components/FormField.jsx';
import { useAsyncForm } from '../lib/useAsyncForm.js';
import { IconInfo, IconAlert, IconPlus, IconSearch } from '../lib/icons.jsx';

const STATUS_MAP = { active: 'success', pending: 'warning', inactive: 'neutral', suspended: 'danger' };
const PER_PAGE = 10;

export default function AdminUsers() {
  return (
    <PermissionGate permission="user_management.view">
      <AdminUsersContent />
    </PermissionGate>
  );
}

function AdminUsersContent() {
  const { user: currentUser, setUser: setCurrentUser } = useAuth();
  const { toastSuccess, toastError } = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState(null);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);
  const [roles, setRoles] = useState([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [manageUser, setManageUser] = useState(null); // full UserResource
  const [manageTab, setManageTab] = useState('details');
  const [confirmModal, setConfirmModal] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    Api.listRoles({ per_page: 100 })
      .then((res) => setRoles(res.data || []))
      .catch((err) => toastError('Could not load roles: ' + err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Editing your own account through this admin UI only updates local state
  // here; without this, pages reading the global AuthContext user (Dashboard,
  // Security) would keep showing stale data until a full page reload.
  function syncSelf(updatedUser) {
    if (updatedUser && updatedUser.id === currentUser?.id) {
      setCurrentUser(updatedUser);
    }
  }

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await Api.listUsers({ search: search || undefined, status: status || undefined, per_page: PER_PAGE, page });
      setUsers(res.data || []);
      setMeta(res.meta || null);
    } catch (err) {
      setError(err.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  const debouncedSetSearch = useCallback(
    debounce((v) => {
      setPage(1);
      setSearch(v);
    }, 350),
    []
  );

  async function openManage(id) {
    try {
      const { data } = await Api.getUser(id);
      setManageUser(data);
      setManageTab('details');
    } catch (err) {
      toastError(err.message);
    }
  }

  function requestDelete(user) {
    setConfirmModal({
      title: 'Delete this user?',
      body: `${user.fullname} will be soft-deleted and lose access immediately.`,
      confirmLabel: 'Delete',
      action: async () => {
        await Api.deleteUser(user.id);
        setConfirmModal(null);
        setManageUser(null);
        toastSuccess('User deleted.');
        load();
      },
    });
  }

  async function runConfirmModal() {
    if (!confirmModal) return;
    setConfirmLoading(true);
    try {
      await confirmModal.action();
    } catch (err) {
      toastError(err.message);
    } finally {
      setConfirmLoading(false);
    }
  }

  async function activateNow(user) {
    try {
      const { data } = await Api.activateUser(user.id);
      setManageUser(data);
      syncSelf(data);
      toastSuccess('User activated.');
      load();
    } catch (err) {
      toastError(err.message);
    }
  }

  function requestDeactivate(user) {
    setConfirmModal({
      title: 'Deactivate this user?',
      body: `${user.fullname} will immediately lose access and be signed out of any active session.`,
      confirmLabel: 'Deactivate',
      action: async () => {
        const { data } = await Api.deactivateUser(user.id);
        setConfirmModal(null);
        setManageUser(data);
        syncSelf(data);
        toastSuccess('User deactivated.');
        load();
      },
    });
  }

  async function toggleRole(roleId, checked) {
    try {
      if (checked) await Api.assignRole(manageUser.id, roleId);
      else await Api.revokeRole(manageUser.id, roleId);
      const { data } = await Api.getUser(manageUser.id);
      setManageUser(data);
      syncSelf(data);
      toastSuccess(checked ? 'Role assigned.' : 'Role revoked.');
      load();
    } catch (err) {
      toastError(err.message);
      throw err;
    }
  }

  return (
    <>
      <div className="section-head">
        <div>
          <h3 style={{ fontSize: 22 }}>Team members</h3>
          <div className="sub">Search, invite, and manage access for everyone in your organization.</div>
        </div>
        <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
          <IconPlus width="15" height="15" /> Invite user
        </Button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <IconSearch />
          <input className="input" placeholder="Search name or email…" onChange={(e) => debouncedSetSearch(e.target.value)} />
        </div>
        <select
          className="input"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
        <div className="toolbar-spacer" />
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Status</th>
                <th>Roles</th>
                <th>Last login</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {error && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty">
                      <div className="ic"><IconAlert /></div>
                      <h4>Could not load users</h4>
                      <p className="text-muted" style={{ fontSize: 13 }}>{error}</p>
                    </div>
                  </td>
                </tr>
              )}
              {!error && users === null && (
                <tr>
                  <td colSpan={5}>
                    <div className="skel" style={{ height: 44 }} />
                  </td>
                </tr>
              )}
              {!error && users && users.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty">
                      <div className="ic"><IconInfo /></div>
                      <h4>No users found</h4>
                    </div>
                  </td>
                </tr>
              )}
              {!error &&
                users &&
                users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="cell-user">
                        {u.avatar ? (
                          <div className="avatar avatar-sm" style={{ backgroundImage: `url('${u.avatar}')`, backgroundSize: 'cover' }} />
                        ) : (
                          <div className="avatar avatar-sm">{initials(u.fullname)}</div>
                        )}
                        <div>
                          <div className="name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {u.fullname}
                            {u.id === currentUser?.id && <span className="badge badge-accent">Me</span>}
                          </div>
                          <div className="sub">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${STATUS_MAP[u.status] || 'neutral'}`}>
                        <span className="badge-dot" />
                        {u.status}
                      </span>
                    </td>
                    <td>
                      {(u.role_names || []).length ? (
                        u.role_names.map((r) => (
                          <span className="badge badge-accent" style={{ marginRight: 4 }} key={r}>{r}</span>
                        ))
                      ) : (
                        <span className="text-subtle">-</span>
                      )}
                    </td>
                    <td className="text-muted">{u.last_login ? timeAgo(u.last_login) : 'Never'}</td>
                    <td>
                      <Button variant="secondary" size="sm" onClick={() => openManage(u.id)}>Manage</Button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {meta && meta.total > 0 && (
        <div className="pagination">
          <div className="info">
            Showing {meta.from || 0}–{meta.to || 0} of {meta.total}
          </div>
          <div className="controls">
            <Button variant="secondary" size="sm" disabled={meta.current_page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="secondary" size="sm" disabled={meta.current_page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      <CreateUserModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        roles={roles}
        onCreated={() => {
          setCreateOpen(false);
          toastSuccess('Invitation sent.');
          load();
        }}
      />

      <ManageUserModal
        user={manageUser}
        tab={manageTab}
        setTab={setManageTab}
        roles={roles}
        onClose={() => setManageUser(null)}
        onSaved={(u) => {
          setManageUser(u);
          syncSelf(u);
          toastSuccess('User details updated.');
          load();
        }}
        onActivate={activateNow}
        onToggleRole={toggleRole}
        onRequestDelete={requestDelete}
        onRequestDeactivate={requestDeactivate}
      />

      <ConfirmModal
        open={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title={confirmModal?.title}
        body={confirmModal?.body}
        confirmLabel={confirmModal?.confirmLabel}
        loading={confirmLoading}
        onConfirm={runConfirmModal}
      />
    </>
  );
}

function CreateUserModal({ open, onClose, roles, onCreated }) {
  const [form, setForm] = useState({ firstname: '', lastname: '', email: '', phone_number: '', assigned_role_id: '' });

  function field(name) {
    return { value: form[name], onChange: (e) => setForm((f) => ({ ...f, [name]: e.target.value })) };
  }

  const { loading, fieldErrors, submit } = useAsyncForm(async () => {
    const payload = { ...form };
    if (!payload.phone_number) delete payload.phone_number;
    await Api.createUser(payload);
    setForm({ firstname: '', lastname: '', email: '', phone_number: '', assigned_role_id: '' });
    onCreated();
  });

  return (
    <Modal open={open} onClose={onClose} title="Invite a user" maxWidth={460}>
      <form onSubmit={submit} noValidate>
        <div className="field-row">
          <FormField id="c_firstname" label="First name" required {...field('firstname')} error={fieldErrors.firstname} />
          <FormField id="c_lastname" label="Last name" required {...field('lastname')} error={fieldErrors.lastname} />
        </div>
        <FormField id="c_email" label="Email" type="email" required {...field('email')} error={fieldErrors.email} />
        <FormField id="c_phone" label="Phone" type="tel" optional hint="Country code, no leading 0 or +, e.g. 2348012345678" {...field('phone_number')} error={fieldErrors.phone_number} />
        <SelectField id="c_role" label="Role" required {...field('assigned_role_id')} error={fieldErrors.assigned_role_id}>
          <option value=""></option>
          {roles.map((r) => (
            <option value={r.id} key={r.id}>{r.name}</option>
          ))}
        </SelectField>
        <div className="hint" style={{ margin: '-14px 0 18px' }}>They&apos;ll receive an activation email to set their own password.</div>
        <Button type="submit" variant="primary" className="btn-block" loading={loading}>Send invitation</Button>
      </form>
    </Modal>
  );
}

function ManageUserModal({ user, tab, setTab, roles, onClose, onSaved, onActivate, onToggleRole, onRequestDelete, onRequestDeactivate }) {
  const [form, setForm] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [roleLoadingId, setRoleLoadingId] = useState(null);

  useEffect(() => {
    if (user) {
      setForm({
        firstname: user.firstname || '',
        lastname: user.lastname || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        gender: user.gender || '',
        can_login: user.status !== 'suspended',
        two_fa: !!user.two_fa,
      });
    }
  }, [user]);

  const { loading, fieldErrors, submit } = useAsyncForm(async () => {
    const payload = { ...form };
    if (!payload.gender) delete payload.gender;
    const { data } = await Api.updateUser(user.id, payload);
    onSaved(data);
  });

  if (!user || !form) return <Modal open={false} onClose={onClose} maxWidth={480} />;

  const userRoleIds = new Set((user.roles || []).map((r) => r.id));

  return (
    <Modal open={!!user} onClose={onClose} title={user.fullname} maxWidth={480}>
      <div className="tabs" style={{ marginBottom: 20 }}>
        <div className={`tab${tab === 'details' ? ' active' : ''}`} onClick={() => setTab('details')}>Details</div>
        <div className={`tab${tab === 'roles' ? ' active' : ''}`} onClick={() => setTab('roles')}>Roles</div>
        <div className={`tab${tab === 'danger' ? ' active' : ''}`} onClick={() => setTab('danger')}>Danger zone</div>
      </div>

      {tab === 'details' && (
        <form onSubmit={submit} noValidate>
          <div className="field-row">
            <FormField id="e_firstname" label="First name" required value={form.firstname} onChange={(e) => setForm((f) => ({ ...f, firstname: e.target.value }))} error={fieldErrors.firstname} />
            <FormField id="e_lastname" label="Last name" required value={form.lastname} onChange={(e) => setForm((f) => ({ ...f, lastname: e.target.value }))} error={fieldErrors.lastname} />
          </div>
          <FormField id="e_email" label="Email" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} error={fieldErrors.email} />
          <FormField id="e_phone" label="Phone" type="tel" hint="Country code, no leading 0 or +, e.g. 2348012345678" value={form.phone_number} onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))} error={fieldErrors.phone_number} />
          <SelectField id="e_gender" label="Gender" value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))} error={fieldErrors.gender}>
            <option value="">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </SelectField>
          <div className="field" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ margin: 0 }}>Can log in</label>
            <label className="switch">
              <input type="checkbox" checked={form.can_login} onChange={(e) => setForm((f) => ({ ...f, can_login: e.target.checked }))} />
              <span className="track" />
            </label>
          </div>
          <div className="field" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ margin: 0 }}>Require two-factor</label>
            <label className="switch">
              <input type="checkbox" checked={form.two_fa} onChange={(e) => setForm((f) => ({ ...f, two_fa: e.target.checked }))} />
              <span className="track" />
            </label>
          </div>
          <Button type="submit" variant="primary" className="btn-block" loading={loading}>Save changes</Button>
        </form>
      )}

      {tab === 'roles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 320, overflowY: 'auto' }}>
          {roles.map((r) => (
            <label key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', cursor: 'pointer' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{r.name}</div>
                <div className="text-subtle" style={{ fontSize: 11.5 }}>{(r.permissions || []).length} permissions</div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={userRoleIds.has(r.id)}
                  disabled={roleLoadingId === r.id}
                  onChange={async (e) => {
                    const checked = e.target.checked;
                    setRoleLoadingId(r.id);
                    try {
                      await onToggleRole(r.id, checked);
                    } catch (err) {
                      /* toast already shown by caller */
                    } finally {
                      setRoleLoadingId(null);
                    }
                  }}
                />
                <span className="track" />
              </label>
            </label>
          ))}
        </div>
      )}

      {tab === 'danger' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Account status</div>
              <div className="text-muted" style={{ fontSize: 12.5 }}>Currently {user.status}.</div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              loading={statusLoading}
              onClick={async () => {
                if (user.status === 'active') {
                  onRequestDeactivate(user);
                  return;
                }
                setStatusLoading(true);
                try {
                  await onActivate(user);
                } finally {
                  setStatusLoading(false);
                }
              }}
            >
              {user.status !== 'active' ? 'Activate' : 'Deactivate'}
            </Button>
          </div>
          <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderColor: 'rgba(248,113,113,0.3)' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#fca5a5' }}>Delete user</div>
              <div className="text-muted" style={{ fontSize: 12.5 }}>Soft-deletes this account.</div>
            </div>
            <Button variant="danger" size="sm" onClick={() => onRequestDelete(user)}>Delete</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
