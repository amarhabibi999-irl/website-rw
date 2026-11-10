"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, CheckCircle2, Clock, Search, Eye, X, Edit, Trash2, Save, UserPlus } from "lucide-react";
import Link from "next/link";

export default function AdminDataWargaPage() {
  const [loading, setLoading] = useState(true);
  const [wargaList, setWargaList] = useState<any[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [adminId, setAdminId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // State Modal Detail
  const [selectedWarga, setSelectedWarga] = useState<any>(null);
  const [detailKK, setDetailKK] = useState<any[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // State Modal Edit
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [savingEdit, setSavingEdit] = useState(false);

  // State Modal Tambah User
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ nama_lengkap: "", email: "", password: "", role: "WARGA" });
  const [adding, setAdding] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const fetchWarga = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (data) setWargaList(data);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push("/login");
      
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
      if (profile?.role !== 'ADMIN' && profile?.role !== 'SUPERADMIN') return router.push("/");
      
      setUserRole(profile.role);
      setAdminId(session.user.id);

      await fetchWarga();
      setLoading(false);
    };
    init();
  }, [router, supabase]);

  const handleApprove = async (id: string) => {
    setUpdatingId(id);
    const { error } = await supabase.from("profiles").update({ status: "AKTIF" }).eq("id", id);
    if (error) alert("Gagal approve: " + error.message);
    else await fetchWarga();
    setUpdatingId(null);
  };

  const handleChangeRole = async (id: string, newRole: string) => {
    if (!confirm(`Yakin mau ubah role user ini menjadi ${newRole}?`)) return;
    setUpdatingId(id);
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", id);
    if (error) alert("Gagal ubah role: " + error.message);
    else await fetchWarga();
    setUpdatingId(null);
  };

  const openDetail = async (warga: any) => {
    setSelectedWarga(warga);
    setIsDetailOpen(true);
    const { data } = await supabase.from("kartu_keluarga").select("*").eq("profile_id", warga.id);
    if (data) setDetailKK(data);
  };

  const openEdit = (warga: any) => {
    setEditForm(warga);
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);
    const { error } = await supabase.from("profiles").update({
      nama_lengkap: editForm.nama_lengkap,
      nik: editForm.nik,
      no_kk: editForm.no_kk,
      no_hp: editForm.no_hp,
      alamat_utama: editForm.alamat_utama,
      kontak_darurat: editForm.kontak_darurat,
      alamat_darurat: editForm.alamat_darurat,
    }).eq("id", editForm.id);

    if (error) alert("Gagal edit: " + error.message);
    else {
      alert("Data warga berhasil diperbarui!");
      setIsEditOpen(false);
      await fetchWarga();
    }
    setSavingEdit(false);
  };

  const handleDelete = async (id: string, nama: string) => {
    if (!confirm(`HAPUS PERMANEN data warga ${nama}? Tindakan ini tidak bisa dibatalkan.`)) return;
    setUpdatingId(id);
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) alert("Gagal hapus: " + error.message);
    else await fetchWarga();
    setUpdatingId(null);
  };

  // FUNGSI TAMBAH USER BARU (Tembak API Route)
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...addForm, adminId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert("User baru berhasil ditambahkan!");
      setIsAddOpen(false);
      setAddForm({ nama_lengkap: "", email: "", password: "", role: "WARGA" });
      await fetchWarga();
    } catch (error: any) {
      alert("Gagal menambah user: " + error.message);
    } finally {
      setAdding(false);
    }
  };

  const filteredWarga = wargaList.filter(w => 
    w.nama_lengkap?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.no_hp?.includes(searchQuery)
  );

  if (loading) return <div className="p-8 text-center text-blue-600 font-bold">Memuat...</div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-2">
        <ArrowLeft size={20} /> Kembali ke Dashboard
      </Link>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b pb-4">
          <div className="flex items-center gap-3">
            <Users size={28} className="text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Data Warga</h1>
          </div>
          
          {/* KOTAK PENCARIAN & TOMBOL TAMBAH */}
          <div className="flex w-full md:w-auto items-center gap-2">
            <div className="relative flex-1 md:w-64">
              <Search size={16} className="absolute left-3 top-3 text-gray-400" />
              <input type="text" placeholder="Cari nama..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-full border border-gray-300 rounded-lg p-2 text-sm text-black" />
            </div>
            <button onClick={() => setIsAddOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition flex items-center gap-2 whitespace-nowrap">
              <UserPlus size={18} /> Tambah
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredWarga.map((warga) => (
            <div key={warga.id} className="border border-gray-200 p-4 rounded-xl bg-gray-50 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-gray-800">{warga.nama_lengkap}</h3>
                  {warga.status === "PENDING" ? (
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold"><Clock size={12}/> Pending</span>
                  ) : (
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold"><CheckCircle2 size={12}/> Aktif</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">No HP: {warga.no_hp || "-"}</p>
                <p className="text-sm font-semibold text-blue-600 mt-1">Role: {warga.role}</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-gray-200">
                <button onClick={() => openDetail(warga)} className="flex-1 bg-white border border-blue-600 text-blue-600 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition flex items-center justify-center gap-1">
                  <Eye size={16} /> Detail
                </button>
                <button onClick={() => openEdit(warga)} className="bg-white border border-gray-400 text-gray-700 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-1">
                  <Edit size={16} /> Edit
                </button>
                {userRole === "SUPERADMIN" && (
                  <button onClick={() => handleDelete(warga.id, warga.nama_lengkap)} disabled={updatingId === warga.id} className="bg-white border border-red-500 text-red-600 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-red-50 transition flex items-center justify-center gap-1">
                    <Trash2 size={16} /> Hapus
                  </button>
                )}
                {warga.status === "PENDING" && (
                  <button onClick={() => handleApprove(warga.id)} disabled={updatingId === warga.id} className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 flex items-center justify-center gap-1 mt-2 md:mt-0">
                    <CheckCircle2 size={16} /> Approve
                  </button>
                )}
                {userRole === "SUPERADMIN" && warga.status === "AKTIF" && (
                  <select onChange={(e) => handleChangeRole(warga.id, e.target.value)} value={warga.role} className="flex-1 border border-gray-300 text-sm rounded-lg p-2 bg-white mt-2 md:mt-0">
                    <option value="WARGA">Role: WARGA</option>
                    <option value="SECURITY">Role: SECURITY</option>
                    <option value="ADMIN">Role: ADMIN</option>
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL TAMBAH USER BARU */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setIsAddOpen(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20} /></button>
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Tambah User Baru</h2>
            
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Lengkap</label>
                <input type="text" required value={addForm.nama_lengkap} onChange={e => setAddForm({...addForm, nama_lengkap: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-black" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input type="email" required value={addForm.email} onChange={e => setAddForm({...addForm, email: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-black" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Password Sementara</label>
                <input type="text" required value={addForm.password} onChange={e => setAddForm({...addForm, password: e.target.value})} placeholder="Minimal 6 karakter" className="w-full border border-gray-300 rounded-lg p-2 text-black" />
              </div>
              
              {/* Dropdown Role: Cuma muncul buat SUPERADMIN */}
              {userRole === "SUPERADMIN" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Role (Jabatan)</label>
                  <select value={addForm.role} onChange={e => setAddForm({...addForm, role: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-black">
                    <option value="WARGA">Warga</option>
                    <option value="SECURITY">Security</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              )}

              <button type="submit" disabled={adding} className="mt-4 w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400">
                <UserPlus size={20} /> {adding ? "Menyimpan..." : "Buat Akun"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETAIL WARGA */}
      {isDetailOpen && selectedWarga && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative">
            <button onClick={() => setIsDetailOpen(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20} /></button>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">{selectedWarga.nama_lengkap}</h2>
            <p className="text-blue-600 font-semibold mb-6">Role: {selectedWarga.role}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
              <div className="bg-gray-50 p-3 rounded-lg"><span className="text-gray-500 block text-xs">NIK</span> {selectedWarga.nik || "-"}</div>
              <div className="bg-gray-50 p-3 rounded-lg"><span className="text-gray-500 block text-xs">No KK</span> {selectedWarga.no_kk || "-"}</div>
              <div className="bg-gray-50 p-3 rounded-lg"><span className="text-gray-500 block text-xs">No HP Utama</span> {selectedWarga.no_hp || "-"}</div>
              <div className="bg-gray-50 p-3 rounded-lg"><span className="text-gray-500 block text-xs">Kontak Darurat</span> {selectedWarga.kontak_darurat || "-"}</div>
            </div>

            <div className="mb-6">
              <h3 className="font-bold text-gray-700 border-b pb-2 mb-2">Alamat</h3>
              <p className="text-sm"><span className="font-semibold">Utama:</span> {selectedWarga.alamat_utama || "-"}</p>
              <p className="text-sm mt-1"><span className="font-semibold">Darurat:</span> {selectedWarga.alamat_darurat || "-"}</p>
            </div>

            <div>
              <h3 className="font-bold text-gray-700 border-b pb-2 mb-2">Anggota Keluarga (KK)</h3>
              {detailKK.length === 0 ? <p className="text-sm text-gray-500 italic">Belum ada data.</p> : (
                <ul className="space-y-2">
                  {detailKK.map((kk) => (
                    <li key={kk.id} className="text-sm bg-blue-50 p-2 rounded flex justify-between"><span>{kk.nama_anggota}</span><span className="font-semibold text-blue-700">{kk.hubungan}</span></li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT WARGA */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative">
            <button onClick={() => setIsEditOpen(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20} /></button>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">Edit Data Warga</h2>
            
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Lengkap</label>
                  <input type="text" required value={editForm.nama_lengkap || ""} onChange={e => setEditForm({...editForm, nama_lengkap: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-black" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">No HP</label>
                  <input type="text" value={editForm.no_hp || ""} onChange={e => setEditForm({...editForm, no_hp: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-black" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">NIK</label>
                  <input type="number" value={editForm.nik || ""} onChange={e => setEditForm({...editForm, nik: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-black" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">No KK</label>
                  <input type="number" value={editForm.no_kk || ""} onChange={e => setEditForm({...editForm, no_kk: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-black" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Alamat Utama</label>
                <input type="text" value={editForm.alamat_utama || ""} onChange={e => setEditForm({...editForm, alamat_utama: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-black" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Kontak Darurat</label>
                  <input type="text" value={editForm.kontak_darurat || ""} onChange={e => setEditForm({...editForm, kontak_darurat: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-black" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Alamat Darurat</label>
                  <input type="text" value={editForm.alamat_darurat || ""} onChange={e => setEditForm({...editForm, alamat_darurat: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-black" />
                </div>
              </div>
              <button type="submit" disabled={savingEdit} className="mt-4 w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400">
                <Save size={20} /> {savingEdit ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}