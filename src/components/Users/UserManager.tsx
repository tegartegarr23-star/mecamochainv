import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  User,
  Trash2,
  X,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { UserRole } from '../../types';
import { formatDate } from '../../utils/formatters';

export const UserManager: React.FC = () => {
  const { users, currentUser, isSuperAdmin, addUser, deleteUser } = useInventory();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('karyawan');

  if (!isSuperAdmin) {
    return (
      <div className="p-8 rounded-2xl bg-white border border-stone-200 text-center max-w-lg mx-auto my-12 space-y-3">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-stone-900 font-serif">Akses Dibatasi</h3>
        <p className="text-xs text-stone-500">
          Menu Manajemen User hanya dapat diakses oleh Akun Super Admin.
        </p>
      </div>
    );
  }

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) return;

    addUser({
      email,
      name,
      role,
      is_superadmin: role === 'super_admin',
    });

    setEmail('');
    setName('');
    setRole('karyawan');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h3 className="font-bold text-stone-900 text-base font-serif">Manajemen User System</h3>
          <p className="text-xs text-stone-500">
            Hak akses istimewa Super Admin untuk menambah dan menghapus akun pengguna
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
        >
          <UserPlus className="w-4 h-4" /> + Tambah Pengguna Baru
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
            <tr>
              <th className="p-3.5">Nama Pengguna</th>
              <th className="p-3.5">Email</th>
              <th className="p-3.5">Hak Akses / Role</th>
              <th className="p-3.5">Tanggal Dibuat</th>
              <th className="p-3.5 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {users.map((u) => {
              const isSelf = u.id === currentUser.id;
              return (
                <tr key={u.id} className="hover:bg-stone-50">
                  <td className="p-3.5 font-bold text-stone-900">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center text-xs">
                        {u.name.charAt(0)}
                      </div>
                      <span>{u.name}</span>
                      {isSelf && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-200 text-stone-700 font-medium">
                          (Anda)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-stone-600">{u.email}</td>
                  <td className="p-3.5">
                    {u.is_superadmin || u.role === 'super_admin' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-700" /> Super Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-medium">
                        <User className="w-3.5 h-3.5 text-stone-500" /> Karyawan / Staff
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-stone-500">{formatDate(u.created_at)}</td>
                  <td className="p-3.5 text-center">
                    {!isSelf && users.length > 1 && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Hapus pengguna "${u.name}"?`)) {
                            deleteUser(u.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Hapus User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ADD USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-stone-900 text-base font-serif">Tambah User Baru</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Andi Wijaya"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Alamat Email</label>
                <input
                  type="email"
                  required
                  placeholder="Contoh: staff@mecamocha.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Hak Akses / Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-stone-50 border border-stone-200 focus:outline-none"
                >
                  <option value="karyawan">Karyawan / Staff Kitchen (Hak Akses Transaksi)</option>
                  <option value="super_admin">Super Admin (Hak Akses Penuh & User Management)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-800 text-white font-bold text-xs shadow-md"
                >
                  Simpan User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
