"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { User, CreditCard, Phone, MapPin, Save, ArrowLeft, Users, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

export default function ProfilPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    nama_lengkap: "",
    nik: "",
    no_kk: "",
    no_hp: "",
    alamat_utama: "",
    kontak_darurat: "",
    alamat_darurat: "",
  });

  // State untuk Anggota Keluarga
  const [anggotaKeluarga, setAnggotaKeluarga] = useState<any[]>([]);
  const [newAnggota, setNewAnggota] = useState({ nama_anggota: "", hubungan: "" });

  const supabase = createClient();
  const router = useRouter();

  const fetchProfilDanKK = async (uid: string) => {
    // Ambil profil
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
    if (data) {
      setFormData({
        nama_lengkap: data.nama_lengkap || "",
        nik: data.nik || "",
        no_kk: data.no_kk || "",
        no_hp: data.no_hp || "",
        alamat_utama: data.alamat_utama || "",
        kontak_darurat: data.kontak_darurat || "",
        alamat_darurat: data.alamat_darurat || "",
      });
    }
    // Ambil KK
    const { data: kkData } = await supabase.from("kartu_keluarga").select("*").eq("profile_id", uid);
    if (kkData) setAnggotaKeluarga(kkData);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUserId(session.user.id);
      await fetchProfilDanKK(session.user.id);
      setLoading(false);
    };
    init();
  }, [router, supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveProfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);

    const { error } = await supabase.from("profiles").update(formData).eq("id", userId);
    if (error) alert("Gagal menyimpan profil: " + error.message);
    else alert("Profil berhasil disimpan!");
    setSaving(false);
  };

  const handleAddAnggota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !newAnggota.nama_anggota || !newAnggota.hubungan) return;
    
    const { error } = await supabase.from("kartu_keluarga").insert({
      profile_id: userId,
      nama_anggota: newAnggota.nama_anggota,
      hubungan: newAnggota.hubungan
    });

    if (!error) {
      setNewAnggota({ nama_anggota: "", hubungan: "" });
      await fetchProfilDanKK(userId);
    } else {
      alert("Gagal tambah anggota: " + error.message);
    }
  };

  const handleDeleteAnggota = async (id: string) => {
    if (!confirm("Hapus anggota keluarga ini?")) return;
    await supabase.from("kartu_keluarga").delete().eq("id", id);
    if (userId) await fetchProfilDanKK(userId);
  };

  if (loading) return <div className="p-8 text-center text-blue-600 font-bold">Memuat...</div>;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto w-full space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-2">
        <ArrowLeft size={20} /> Kembali ke Dashboard
      </Link>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6 border-b pb-4">
          <User size={28} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Profil Saya</h1>
        </div>

        <form onSubmit={handleSaveProfil} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Lengkap</label>
            <input type="text" name="nama_lengkap" value={formData.nama_lengkap} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg p-2.5 text-black" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">NIK</label>
              <input type="number" name="nik" value={formData.nik} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 text-black" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">No KK</label>
              <input type="number" name="no_kk" value={formData.no_kk} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 text-black" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Alamat Utama (Tinggal Dimana)</label>
            <textarea name="alamat_utama" value={formData.alamat_utama} onChange={handleChange} rows={2} className="w-full border border-gray-300 rounded-lg p-2.5 text-black"></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">No HP Utama</label>
              <input type="tel" name="no_hp" value={formData.no_hp} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 text-black" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Kontak Darurat</label>
              <input type="tel" name="kontak_darurat" value={formData.kontak_darurat} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 text-black" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Alamat Darurat</label>
            <textarea name="alamat_darurat" value={formData.alamat_darurat} onChange={handleChange} rows={2} className="w-full border border-gray-300 rounded-lg p-2.5 text-black"></textarea>
          </div>

          <button type="submit" disabled={saving} className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400">
            <Save size={20} /> {saving ? "Menyimpan..." : "Simpan Data Diri"}
          </button>
        </form>
      </div>

      {/* SECTION DATA KELUARGA */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6 border-b pb-4">
          <Users size={28} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Data Keluarga (Sesuai KK)</h1>
        </div>

        {/* List Anggota */}
        <div className="space-y-3 mb-6">
          {anggotaKeluarga.length === 0 ? (
            <p className="text-gray-500 italic">Belum ada data anggota keluarga.</p>
          ) : (
            anggotaKeluarga.map((anggota) => (
              <div key={anggota.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div>
                  <p className="font-bold text-gray-800">{anggota.nama_anggota}</p>
                  <p className="text-sm text-gray-500">{anggota.hubungan}</p>
                </div>
                <button onClick={() => handleDeleteAnggota(anggota.id)} className="text-red-500 hover:text-red-700 p-2">
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Form Tambah Anggota */}
        <form onSubmit={handleAddAnggota} className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col md:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Anggota</label>
            <input type="text" required value={newAnggota.nama_anggota} onChange={(e) => setNewAnggota({...newAnggota, nama_anggota: e.target.value})} placeholder="Nama anak/istri" className="w-full border border-gray-300 rounded-lg p-2 text-black" />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Hubungan</label>
            <input type="text" required value={newAnggota.hubungan} onChange={(e) => setNewAnggota({...newAnggota, hubungan: e.target.value})} placeholder="Contoh: Anak, Istri" className="w-full border border-gray-300 rounded-lg p-2 text-black" />
          </div>
          <button type="submit" className="w-full md:w-auto bg-blue-600 text-white p-2.5 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-1">
            <Plus size={18} /> Tambah
          </button>
        </form>
      </div>

    </div>
  );
}