"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowLeft, Receipt, PlusCircle, CheckCircle2, Clock, Eye, X, Save } from "lucide-react";
import Link from "next/link";

export default function AdminIplPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [wargaList, setWargaList] = useState<any[]>([]);
  const [tagihanList, setTagihanList] = useState<any[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // State buat Modal Bukti Transfer
  const [selectedBukti, setSelectedBukti] = useState<string | null>(null);

  // State Form Buat Tagihan
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    profile_id: "",
    bulan: "Januari",
    tahun: new Date().getFullYear(),
    nominal: "50000"
  });

  // State buat Pengaturan Rekening
  const [rekening, setRekening] = useState({ nama_bank: "", nomor_rekening: "", atas_nama: "" });
  const [savingRekening, setSavingRekening] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const fetchData = async () => {
    // Ambil daftar warga aktif
    const { data: warga } = await supabase.from("profiles").select("id, nama_lengkap").eq("role", "WARGA").eq("status", "AKTIF");
    if (warga) setWargaList(warga);

    // Ambil semua tagihan beserta nama warganya
    const { data: tagihan } = await supabase
      .from("ipl_tagihan")
      .select(`*, profiles (nama_lengkap)`)
      .order("created_at", { ascending: false });
    if (tagihan) setTagihanList(tagihan);

    // Ambil data rekening RW
    const { data: setting } = await supabase.from("pengaturan_rw").select("*").eq("id", 1).single();
    if (setting) setRekening(setting);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push("/login");
      
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
      if (profile?.role !== 'ADMIN' && profile?.role !== 'SUPERADMIN') return router.push("/");

      await fetchData();
      setLoading(false);
    };
    init();
  }, [router, supabase]);

  const handleBuatTagihan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase.from("ipl_tagihan").insert({
      profile_id: formData.profile_id,
      bulan: formData.bulan,
      tahun: formData.tahun,
      nominal: parseFloat(formData.nominal),
      status: "BELUM"
    });

    if (error) {
      alert("Gagal buat tagihan: " + error.message);
    } else {
      alert("Tagihan berhasil dibuat!");
      setShowForm(false);
      await fetchData();
    }
    setSubmitting(false);
  };

  const handleKonfirmasiLunas = async (id: string) => {
    if (!confirm("Yakin bukti transfer ini valid dan mau ditandai LUNAS?")) return;
    setUpdatingId(id);
    const { error } = await supabase.from("ipl_tagihan").update({ status: "LUNAS" }).eq("id", id);
    if (error) alert("Gagal update: " + error.message);
    else await fetchData();
    setUpdatingId(null);
  };

  const handleSaveRekening = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRekening(true);
    const { error } = await supabase.from("pengaturan_rw").update(rekening).eq("id", 1);
    if (error) alert("Gagal simpan: " + error.message);
    else alert("Rekening RW berhasil diperbarui!");
    setSavingRekening(false);
  };

  if (loading) return <div className="p-8 text-center text-blue-600 font-bold">Memuat Data IPL...</div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-2">
        <ArrowLeft size={20} /> Kembali ke Dashboard
      </Link>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b pb-4">
          <div className="flex items-center gap-3">
            <Receipt size={28} className="text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Laporan IPL</h1>
              <p className="text-sm text-gray-500">Buat tagihan dan konfirmasi pembayaran warga.</p>
            </div>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition">
            {showForm ? "Batal" : "+ Buat Tagihan Baru"}
          </button>
        </div>

        {/* FORM EDIT REKENING (BARU) */}
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl mb-6">
          <h3 className="font-bold text-gray-700 text-sm mb-3">Pengaturan Rekening Transfer RW</h3>
          <form onSubmit={handleSaveRekening} className="flex flex-col md:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <label className="text-xs text-gray-500 mb-1 block">Nama Bank</label>
              <input type="text" value={rekening.nama_bank} onChange={e => setRekening({...rekening, nama_bank: e.target.value})} className="w-full border border-gray-300 p-2 rounded-lg text-sm text-black focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex-1 w-full">
              <label className="text-xs text-gray-500 mb-1 block">Nomor Rekening</label>
              <input type="text" value={rekening.nomor_rekening} onChange={e => setRekening({...rekening, nomor_rekening: e.target.value})} className="w-full border border-gray-300 p-2 rounded-lg text-sm text-black focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex-1 w-full">
              <label className="text-xs text-gray-500 mb-1 block">Atas Nama</label>
              <input type="text" value={rekening.atas_nama} onChange={e => setRekening({...rekening, atas_nama: e.target.value})} className="w-full border border-gray-300 p-2 rounded-lg text-sm text-black focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <button type="submit" disabled={savingRekening} className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black w-full md:w-auto flex items-center justify-center gap-2 transition disabled:bg-gray-400">
              <Save size={16} /> {savingRekening ? "Menyimpan..." : "Simpan Rekening"}
            </button>
          </form>
        </div>

        {/* FORM BUAT TAGIHAN */}
        {showForm && (
          <form onSubmit={handleBuatTagihan} className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6 grid grid-cols-1 md:grid-cols-5 gap-3 items-end animate-in fade-in">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Pilih Warga</label>
              <select required value={formData.profile_id} onChange={(e) => setFormData({...formData, profile_id: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm text-black focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">-- Pilih Warga --</option>
                {wargaList.map(w => <option key={w.id} value={w.id}>{w.nama_lengkap}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Bulan</label>
              <select value={formData.bulan} onChange={(e) => setFormData({...formData, bulan: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm text-black focus:ring-2 focus:ring-blue-500 outline-none">
                {["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"].map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Nominal (Rp)</label>
              <input type="number" required value={formData.nominal} onChange={(e) => setFormData({...formData, nominal: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm text-black focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white p-2 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-1">
              <PlusCircle size={16} /> {submitting ? "..." : "Buat"}
            </button>
          </form>
        )}

        {/* TABEL TAGIHAN */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-600 text-sm">
                <th className="p-3 border-b">Nama Warga</th>
                <th className="p-3 border-b">Periode</th>
                <th className="p-3 border-b">Nominal</th>
                <th className="p-3 border-b">Status</th>
                <th className="p-3 border-b text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {tagihanList.length === 0 ? (
                <tr><td colSpan={5} className="text-center p-6 text-gray-500">Belum ada tagihan dibuat.</td></tr>
              ) : (
                tagihanList.map((tagihan) => (
                  <tr key={tagihan.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-semibold text-gray-800">{tagihan.profiles?.nama_lengkap}</td>
                    <td className="p-3 text-sm text-gray-600">{tagihan.bulan} {tagihan.tahun}</td>
                    <td className="p-3 text-sm font-semibold text-gray-800">Rp {tagihan.nominal.toLocaleString('id-ID')}</td>
                    <td className="p-3">
                      {tagihan.status === "BELUM" && <span className="flex items-center gap-1 w-fit bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold"><Clock size={12}/> Belum Bayar</span>}
                      {tagihan.status === "MENUNGGU_KONFIRMASI" && <span className="flex items-center gap-1 w-fit bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold"><Clock size={12}/> Cek Bukti</span>}
                      {tagihan.status === "LUNAS" && <span className="flex items-center gap-1 w-fit bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold"><CheckCircle2 size={12}/> Lunas</span>}
                    </td>
                    <td className="p-3 text-center">
                      {tagihan.status === "MENUNGGU_KONFIRMASI" && (
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setSelectedBukti(tagihan.bukti_transfer_url)} className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200" title="Lihat Bukti">
                            <Eye size={16} />
                          </button>
                          <button onClick={() => handleKonfirmasiLunas(tagihan.id)} disabled={updatingId === tagihan.id} className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-green-700">
                            LUNAS
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL BUKTI TRANSFER */}
      {selectedBukti && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-4 rounded-2xl max-w-lg w-full relative">
            <button onClick={() => setSelectedBukti(null)} className="absolute -top-4 -right-4 bg-white p-2 rounded-full shadow-lg text-red-500 hover:text-red-700">
              <X size={24} />
            </button>
            <h3 className="font-bold text-gray-800 mb-3 text-center">Bukti Transfer Warga</h3>
            <img src={selectedBukti} alt="Bukti" className="w-full h-auto rounded-lg border border-gray-200" />
          </div>
        </div>
      )}
    </div>
  );
}