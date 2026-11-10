"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowLeft, Landmark, Send, Clock, CheckCircle2, XCircle, FileText } from "lucide-react";
import Link from "next/link";

export default function PinjamanWargaPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [riwayat, setRiwayat] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);

  // State form
  const [formData, setFormData] = useState({
    nama_lengkap: "",
    alamat_utama: "",
    alamat_darurat: "",
    no_hp: "",
    no_hp_darurat: "",
    nominal: "",
    rekening_bank: "",
    keperluan: "",
  });

  const supabase = createClient();
  const router = useRouter();

  const fetchRiwayat = async (uid: string) => {
    const { data } = await supabase
      .from("pinjaman")
      .select("*")
      .eq("profile_id", uid)
      .order("created_at", { ascending: false });
    if (data) setRiwayat(data);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUserId(session.user.id);
      
      // Ambil data profil buat auto-fill form
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
      if (profile) {
        setFormData(prev => ({
          ...prev,
          nama_lengkap: profile.nama_lengkap || "",
          alamat_utama: profile.alamat_darurat || "", // Asumsi alamat utama pakai alamat darurat dulu sebagai default
          no_hp: profile.no_hp || "",
          alamat_darurat: profile.alamat_darurat || "",
          no_hp_darurat: profile.kontak_darurat || "",
        }));
      }

      await fetchRiwayat(session.user.id);
      setLoading(false);
    };
    init();
  }, [router, supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSubmitting(true);

    const { error } = await supabase.from("pinjaman").insert({
      profile_id: userId,
      nama_lengkap: formData.nama_lengkap,
      alamat_utama: formData.alamat_utama,
      alamat_darurat: formData.alamat_darurat,
      no_hp: formData.no_hp,
      no_hp_darurat: formData.no_hp_darurat,
      nominal: parseInt(formData.nominal),
      rekening_bank: formData.rekening_bank,
      keperluan: formData.keperluan,
      status: "DIAJUKAN"
    });

    if (error) {
      alert("Gagal mengajukan pinjaman: " + error.message);
    } else {
      alert("Pengajuan pinjaman berhasil dikirim! Mohon tunggu verifikasi Admin.");
      setShowForm(false);
      setFormData({ ...formData, nominal: "", rekening_bank: "", keperluan: "" });
      await fetchRiwayat(userId);
    }
    setSubmitting(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DIAJUKAN": return <span className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold"><Clock size={14}/> Diajukan</span>;
      case "VERIFIKASI_ADMIN": return <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold"><Clock size={14}/> Verifikasi Admin</span>;
      case "APPROVED_BENDAHARA": return <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold"><CheckCircle2 size={14}/> Disetujui Bendahara</span>;
      case "APPROVED_KETUA": return <span className="flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold"><CheckCircle2 size={14}/> Disetujui Ketua</span>;
      case "DICAIRKAN": return <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold"><CheckCircle2 size={14}/> Dana Dicairkan</span>;
      case "DITOLAK": return <span className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold"><XCircle size={14}/> Ditolak</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">{status}</span>;
    }
  };

  if (loading) return <div className="p-8 text-center text-blue-600 font-bold">Memuat...</div>;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto w-full space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-2">
        <ArrowLeft size={20} /> Kembali ke Dashboard
      </Link>

      {/* HEADER & TOMBOL AJUKAN */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <Landmark size={28} className="text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Layanan Pinjaman</h1>
            <p className="text-sm text-gray-500">Ajukan pinjaman modal usaha atau kebutuhan mendesak.</p>
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition">
          {showForm ? "Batal" : "+ Ajukan Pinjaman"}
        </button>
      </div>

      {/* FORM PENGAJUAN */}
      {showForm && (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-md border border-blue-100 animate-in fade-in slide-in-from-top-4">
          <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Form Pengajuan Pinjaman</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Lengkap</label>
                <input type="text" name="nama_lengkap" value={formData.nama_lengkap} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg p-2.5 text-black focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nominal Pinjaman (Rp)</label>
                <input type="number" name="nominal" value={formData.nominal} onChange={handleChange} required placeholder="Contoh: 5000000" className="w-full border border-gray-300 rounded-lg p-2.5 text-black focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Alamat Utama</label>
                <input type="text" name="alamat_utama" value={formData.alamat_utama} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg p-2.5 text-black focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Alamat Darurat</label>
                <input type="text" name="alamat_darurat" value={formData.alamat_darurat} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg p-2.5 text-black focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">No HP Utama</label>
                <input type="tel" name="no_hp" value={formData.no_hp} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg p-2.5 text-black focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">No HP Darurat</label>
                <input type="tel" name="no_hp_darurat" value={formData.no_hp_darurat} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg p-2.5 text-black focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nomor Rekening Bank (Beserta Nama Bank)</label>
              <input type="text" name="rekening_bank" value={formData.rekening_bank} onChange={handleChange} required placeholder="Contoh: BCA 123456789 a.n Budi" className="w-full border border-gray-300 rounded-lg p-2.5 text-black focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Keperluan Peminjaman</label>
              <textarea name="keperluan" value={formData.keperluan} onChange={handleChange} required rows={3} placeholder="Jelaskan tujuan pinjaman..." className="w-full border border-gray-300 rounded-lg p-2.5 text-black focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
            </div>

            <button type="submit" disabled={submitting} className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:bg-gray-400 mt-4">
              <Send size={18} />
              {submitting ? "Mengirim..." : "Kirim Pengajuan"}
            </button>
          </form>
        </div>
      )}

      {/* RIWAYAT PINJAMAN */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FileText size={20} className="text-gray-500"/> Riwayat Pengajuan
        </h2>
        
        {riwayat.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Belum ada pengajuan pinjaman.</p>
        ) : (
          <div className="space-y-4">
            {riwayat.map((item) => (
              <div key={item.id} className="border border-gray-100 p-4 rounded-xl bg-gray-50 flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Tgl Pengajuan: {new Date(item.created_at).toLocaleDateString('id-ID')}</p>
                  <h3 className="font-bold text-lg text-gray-800">Rp {item.nominal.toLocaleString('id-ID')}</h3>
                  <p className="text-sm text-gray-600 mt-1">Keperluan: {item.keperluan}</p>
                  <p className="text-xs text-gray-500 mt-2">Rekening: {item.rekening_bank}</p>
                </div>
                <div className="shrink-0">
                  {getStatusBadge(item.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}