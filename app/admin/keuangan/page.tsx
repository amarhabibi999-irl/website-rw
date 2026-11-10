"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowLeft, PlusCircle, TrendingUp, TrendingDown, Wallet, Trash2 } from "lucide-react";
import Link from "next/link";

export default function AdminKeuanganPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [riwayat, setRiwayat] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>("");
  
  // State Form
  const [tipe, setTipe] = useState<"PEMASUKAN" | "PENGELUARAN">("PEMASUKAN");
  const [nominal, setNominal] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);

  const supabase = createClient();
  const router = useRouter();

  const fetchKeuangan = async () => {
    const { data } = await supabase
      .from("laporan_keuangan")
      .select("*")
      .order("tanggal", { ascending: false })
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
      
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
      if (profile?.role !== 'ADMIN' && profile?.role !== 'SUPERADMIN') {
        alert("Akses ditolak!");
        router.push("/");
        return;
      }
      setUserRole(profile.role);

      await fetchKeuangan();
      setLoading(false);
    };
    init();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { data: { session } } = await supabase.auth.getSession();

    const { error } = await supabase.from("laporan_keuangan").insert({
      tipe,
      nominal: parseFloat(nominal),
      keterangan,
      tanggal,
      created_by: session?.user.id
    });

    if (error) {
      alert("Gagal menambah data: " + error.message);
    } else {
      alert("Data keuangan berhasil disimpan!");
      setNominal("");
      setKeterangan("");
      await fetchKeuangan(); // Refresh tabel
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin mau hapus data ini?")) return;
    const { error } = await supabase.from("laporan_keuangan").delete().eq("id", id);
    if (error) alert("Gagal hapus: " + error.message);
    else await fetchKeuangan();
  };

  // Hitung Total buat ditampilin di atas
  const totalMasuk = riwayat.filter(r => r.tipe === 'PEMASUKAN').reduce((sum, item) => sum + item.nominal, 0);
  const totalKeluar = riwayat.filter(r => r.tipe === 'PENGELUARAN').reduce((sum, item) => sum + item.nominal, 0);
  const saldoKas = totalMasuk - totalKeluar;

  if (loading) return <div className="p-8 text-center text-blue-600 font-bold">Memuat Data Keuangan...</div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-2">
        <ArrowLeft size={20} /> Kembali ke Dashboard
      </Link>

      {/* Ringkasan Angka */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-full text-green-600"><TrendingUp size={24}/></div>
          <div>
            <p className="text-sm text-gray-500 font-semibold">Total Pemasukan</p>
            <h3 className="text-xl font-bold text-gray-800">Rp {totalMasuk.toLocaleString('id-ID')}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-red-100 p-3 rounded-full text-red-600"><TrendingDown size={24}/></div>
          <div>
            <p className="text-sm text-gray-500 font-semibold">Total Pengeluaran</p>
            <h3 className="text-xl font-bold text-gray-800">Rp {totalKeluar.toLocaleString('id-ID')}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-full text-blue-600"><Wallet size={24}/></div>
          <div>
            <p className="text-sm text-gray-500 font-semibold">Saldo Kas RW</p>
            <h3 className="text-xl font-bold text-gray-800">Rp {saldoKas.toLocaleString('id-ID')}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* FORM INPUT */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
              <PlusCircle size={20} className="text-blue-600"/> Input Data
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Jenis Transaksi</label>
                <select value={tipe} onChange={(e) => setTipe(e.target.value as any)} className="w-full border border-gray-300 rounded-lg p-2.5 text-black focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="PEMASUKAN">Pemasukan (Uang Masuk)</option>
                  <option value="PENGELUARAN">Pengeluaran (Uang Keluar)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nominal (Rp)</label>
                <input type="number" required value={nominal} onChange={(e) => setNominal(e.target.value)} placeholder="Contoh: 150000" className="w-full border border-gray-300 rounded-lg p-2.5 text-black focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Keterangan</label>
                <input type="text" required value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="Contoh: Iuran Keamanan Bulan Ini" className="w-full border border-gray-300 rounded-lg p-2.5 text-black focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal</label>
                <input type="date" required value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 text-black focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 transition disabled:bg-gray-400">
                {submitting ? "Menyimpan..." : "Simpan Transaksi"}
              </button>
            </form>
          </div>
        </div>

        {/* TABEL RIWAYAT */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Riwayat Transaksi</h2>
            
            {riwayat.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Belum ada data transaksi.</p>
            ) : (
              <div className="space-y-3">
                {riwayat.map((item) => (
                  <div key={item.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition">
                    <div className="mb-2 md:mb-0">
                      <p className="font-bold text-gray-800">{item.keterangan}</p>
                      <p className="text-xs text-gray-500">{new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-bold ${item.tipe === 'PEMASUKAN' ? 'text-green-600' : 'text-red-600'}`}>
                        {item.tipe === 'PEMASUKAN' ? '+' : '-'} Rp {item.nominal.toLocaleString('id-ID')}
                      </span>
                      
                      {/* Tombol Hapus KHUSUS SUPERADMIN */}
                      {userRole === 'SUPERADMIN' && (
                        <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600 p-1 rounded">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}