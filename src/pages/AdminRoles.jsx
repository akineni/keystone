import { useEffect, useState } from 'react';
import { Api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { fmtDate } from '../lib/format.js';
import { useAsyncForm } from '../lib/useAsyncForm.js';
import { PermissionGate } from '../components/guards.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import FormField from '../components/FormField.jsx';
import { IconAlert, IconEdit, IconInfo, IconPlus, IconTrash } from '../lib/icons.jsx';

export default function AdminRoles() {
  return (
    <PermissionGate permission="user_management.view">
      <AdminRolesContent />
    </PermissionGate>
  );
}

function AdminRolesContent() {
  const { toastSuccess, toastError } = useToast();
  const [permissions, setPermissions] = useState(null);
  const [permError, setPermError] = useState(null);
  const [roles, setRoles] = useState(null);
  const [rolesError, setRolesError] = useState(null);
  const [roleModal, setRoleModal] = useState(null); // null closed, {} create, role edit
  const [confirmModal, setConfirmModal] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  async function loadPermissions() {
    try {
      const res = await Api.listPermissions({ per_page: 100 });
      setPermissions((res.data && res.data.data) || []);
    } catch (err) {
      setPermError(err.message);
    }
  }

  async function loadRoles() {
    setRolesError(null);
    try {
      const res = await Api.listRoles({ per_page: 60 });
      setRoles(res.data || []);
    } catch (err) {
      setRolesError(err.message);
    }
  }

  useEffect(() => {
    loadPermissions();
    loadRoles();
  }, []);

  function requestDelete(role) {
    setConfirmModal({
      title: 'Delete this role?',
      body: `"${role.name}" will be permanently removed. Members holding it will lose its permissions.`,
      action: async () => {
        await Api.deleteRole(role.id);
        setConfirmModal(null);
        toastSuccess('Role deleted.');
        loadRoles();
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

  return (
    <>
      <div className="section-head">
        <div>
          <h3 style={{ fontSize: 22 }}>Roles</h3>
          <div className="sub">Compose roles from the permissions your API exposes.</div>
        </div>
        <Button variant="primary" size="sm" onClick={() => setRoleModal({})}>
          <IconPlus width="15" height="15" /> New role
        </Button>
      </div>

      <div className="grid grid-3">
        {rolesError && (
          <div className="empty" style={{ gridColumn: '1/-1' }}>
            <div className="ic"><IconAlert /></div>
            <h4>Could not load roles</h4>
            <p className="text-muted" style={{ fontSize: 13 }}>{rolesError}</p>
          </div>
        )}
        {!rolesError && roles === null && (
          <>
            <div className="card skel" style={{ height: 170 }} />
            <div className="card skel" style={{ height: 170 }} />
            <div className="card skel" style={{ height: 170 }} />
          </>
        )}
        {!rolesError && roles && roles.length === 0 && (
          <div className="empty" style={{ gridColumn: '1/-1' }}>
            <div className="ic"><IconInfo /></div>
            <h4>No roles yet</h4>
            <p className="text-muted" style={{ fontSize: 13 }}>Create your first role to start assigning access.</p>
          </div>
        )}
        {!rolesError &&
          roles &&
          roles.map((r) => (
            <div className="card role-card" key={r.id}>
              <div className="head">
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15.5 }}>{r.name}</div>
                  <div className="text-subtle" style={{ fontSize: 12, marginTop: 2 }}>{r.users_count != null ? `${r.users_count} member${r.users_count === 1 ? '' : 's'}` : ''}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="icon-btn" style={{ width: 32, height: 32 }} aria-label="Edit role" onClick={() => setRoleModal(r)}>
                    <IconEdit width="15" height="15" />
                  </button>
                  <button className="icon-btn" style={{ width: 32, height: 32 }} aria-label="Delete role" onClick={() => requestDelete(r)}>
                    <IconTrash width="15" height="15" />
                  </button>
                </div>
              </div>
              <div className="perm-chips">
                {(r.permissions || []).slice(0, 4).map((p) => (
                  <span className="badge badge-neutral mono" style={{ fontSize: 10.5 }} key={p}>{p}</span>
                ))}
                {(r.permissions || []).length > 4 && <span className="badge badge-accent">+{r.permissions.length - 4} more</span>}
                {!(r.permissions || []).length && <span className="text-subtle" style={{ fontSize: 12 }}>No permissions assigned</span>}
              </div>
            </div>
          ))}
      </div>

      <div className="section-head" style={{ marginTop: 40 }}>
        <div>
          <h3 style={{ fontSize: 18 }}>Available permissions</h3>
          <div className="sub">
            Every permission string your backend exposes via <span className="mono">GET /roles/permissions</span>.
          </div>
        </div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Permission</th>
                <th>Guard</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {permError && (
                <tr>
                  <td colSpan={3}>{permError}</td>
                </tr>
              )}
              {!permError && permissions === null && (
                <tr>
                  <td colSpan={3}>
                    <div className="skel" style={{ height: 32 }} />
                  </td>
                </tr>
              )}
              {!permError && permissions && permissions.length === 0 && (
                <tr>
                  <td colSpan={3}>
                    <div className="empty">
                      <div className="ic"><IconInfo /></div>
                      <h4>No permissions registered</h4>
                    </div>
                  </td>
                </tr>
              )}
              {!permError &&
                permissions &&
                permissions.map((p) => (
                  <tr key={p.id}>
                    <td className="mono">{p.name}</td>
                    <td><span className="badge badge-neutral">{p.guard_name}</span></td>
                    <td className="text-muted">{fmtDate(p.created_at)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <RoleModal
        role={roleModal}
        permissions={permissions || []}
        onClose={() => setRoleModal(null)}
        onSaved={() => {
          setRoleModal(null);
          loadRoles();
        }}
      />

      <ConfirmModal
        open={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title={confirmModal?.title}
        body={confirmModal?.body}
        confirmLabel="Delete"
        loading={confirmLoading}
        onConfirm={runConfirmModal}
      />
    </>
  );
}

function RoleModal({ role, permissions, onClose, onSaved }) {
  const editing = role && role.id;
  const [name, setName] = useState('');
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    if (!role) return;
    setName(role.name || '');
    setSelected(new Set(role.permissions || []));
  }, [role]);

  const { loading, fieldErrors, submit } = useAsyncForm(async () => {
    const payload = { name, permissions: [...selected] };
    if (editing) await Api.updateRole(role.id, payload);
    else await Api.createRole(payload);
    onSaved();
  });

  function toggle(permName) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(permName)) next.delete(permName);
      else next.add(permName);
      return next;
    });
  }

  return (
    <Modal open={!!role} onClose={onClose} title={editing ? 'Edit role' : 'New role'} maxWidth={460}>
      <form onSubmit={submit} noValidate>
        <FormField id="roleName" label="Role name" required value={name} onChange={(e) => setName(e.target.value)} error={fieldErrors.name} />
        <div className="field">
          <label>Permissions</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
            {permissions.length === 0 && <div className="text-subtle" style={{ fontSize: 13 }}>No permissions available yet.</div>}
            {permissions.map((p) => (
              <label className="perm-check" key={p.id}>
                <input type="checkbox" checked={selected.has(p.name)} onChange={() => toggle(p.name)} />
                <span className="mono" style={{ fontSize: 12.5 }}>{p.name}</span>
              </label>
            ))}
          </div>
        </div>
        <Button type="submit" variant="primary" className="btn-block" loading={loading}>Save role</Button>
      </form>
    </Modal>
  );
}
