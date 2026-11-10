"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowLeft, Landmark, CheckCircle2, XCircle, FileText, ArrowRightCircle, Trash2 } from "lucide-react";
import Link from "next/link";

export default function AdminPinjamanPage() {
  const [loading, setLoading] = useState(true);
  const [pinjamanList, setPinjamanList] = useState<any[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");

  const supabase = createClient();
  const router = useRouter();

  const fetchPinjaman = async () => {
    const { data, error } = await supabase
      .from("pinjaman")
      .select(`*, profiles (nama_lengkap, no_hp)`)
      .order("created_at", { ascending: false });
    if (data) setPinjamanList(data);
    if (error) console.error(error);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push("/login");
      
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
      if (profile?.role !== 'ADMIN' && profile?.role !== 'SUPERADMIN') return router.push("/");
      setUserRole(profile.role);

      await fetchPinjaman();
      setLoading(false);
    };
    init();
  }, [router, supabase]);

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    const { error } = await supabase.from("pinjaman").update({ status: newStatus }).eq("id", id);
    if (error) alert("Gagal update status: " + error.message);
    else await fetchPinjaman();
    setUpdatingId(null);
  };

  const handleTolak = async (id: string) => {
    if (!confirm("Yakin mau menolak pengajuan pinjaman ini?")) return;
    await updateStatus(id, "DITOLAK");
  };

  // FUNGSI HAPUS (KHUSUS SUPERADMIN)
  const handleDelete = async (id: string, nama: string) => {
    if (!confirm(`HAPUS PERMANEN pengajuan pinjaman dari ${nama}?`)) return;
    setUpdatingId(id);
    const { error } = await supabase.from("pinjaman").delete().eq("id", id);
    if (error) alert("Gagal hapus: " + error.message);
    else await fetchPinjaman();
    setUpdatingId(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DIAJUKAN": return <span className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-xs font-bold">Menunggu Verifikasi</span>;
      case "VERIFIKASI_ADMIN": return <span className="bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-full text-xs font-bold">Disetujui Admin</span>;
      case "APPROVED_BENDAHARA": return <span className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold">Disetujui Bendahara</span>;
      case "APPROVED_KETUA": return <span className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-bold">Disetujui Ketua RW</span>;
      case "DICAIRKAN": return <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold">Dana Dicairkan</span>;
      case "DITOLAK": return <span className="bg-red-100 text-red-700 px-3 py-1.5 rounded-full text-xs font-bold">Ditolak</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  if (loading) return <div className="p-8 text-center text-blue-600 font-bold">Memuat Data Pinjaman...</div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-2">
        <ArrowLeft size={20} /> Kembali ke Dashboard
      </Link>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6 border-b pb-4">
          <Landmark size={28} className="text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Pengajuan Pinjaman</h1>
            <p className="text-sm text-gray-500">Verifikasi pengajuan dan teruskan ke Bendahara / Ketua RW.</p>
          </div>
        </div>

        {pinjamanList.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Belum ada pengajuan pinjaman.</p>
        ) : (
          <div className="space-y-4">
            {pinjamanList.map((item) => (
              <div key={item.id} className="border border-gray-200 p-4 md:p-5 rounded-xl bg-gray-50 flex flex-col md:flex-row gap-5">
                
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">{item.profiles?.nama_lengkap}</h3>
                      <p className="text-sm text-gray-500">No HP: {item.profiles?.no_hp || "-"}</p>
                    </div>
                    <div>{getStatusBadge(item.status)}</div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-gray-200 text-sm space-y-1">
                    <p><span className="text-gray-500">Nominal:</span> <span className="font-bold text-blue-700">Rp {item.nominal.toLocaleString('id-ID')}</span></p>
                    <p><span className="text-gray-500">Rekening:</span> {item.rekening_bank}</p>
                    <p><span className="text-gray-500">Keperluan:</span> {item.keperluan}</p>
                    <p><span className="text-gray-500">Alamat:</span> {item.alamat_utama}</p>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col md:items-end justify-center border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-5 gap-2">
                  
                  {item.status === "DIAJUKAN" && (
                    <>
                      <button onClick={() => updateStatus(item.id, "VERIFIKASI_ADMIN")} disabled={updatingId === item.id} className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:bg-gray-400">
                        <ArrowRightCircle size={18} /> Verifikasi & Teruskan
                      </button>
                      <button onClick={() => handleTolak(item.id)} disabled={updatingId === item.id} className="w-full md:w-auto flex items-center justify-center gap-2 bg-white border border-red-500 text-red-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-50 transition disabled:opacity-50">
                        <XCircle size={18} /> Tolak
                      </button>
                    </>
                  )}

                  {item.status === "VERIFIKASI_ADMIN" && (
                    <button onClick={() => updateStatus(item.id, "APPROVED_BENDAHARA")} disabled={updatingId === item.id} className="w-full md:w-auto flex items-center justify-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-600 transition disabled:bg-gray-400">
                      <CheckCircle2 size={18} /> Setujui (Bendahara)
                    </button>
                  )}

                  {item.status === "APPROVED_BENDAHARA" && (
                    <button onClick={() => updateStatus(item.id, "APPROVED_KETUA")} disabled={updatingId === item.id} className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400">
                      <CheckCircle2 size={18} /> Setujui (Ketua RW)
                    </button>
                  )}

                  {item.status === "APPROVED_KETUA" && (
                    <button onClick={() => updateStatus(item.id, "DICAIRKAN")} disabled={updatingId === item.id} className="w-full md:w-auto flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition disabled:bg-gray-400">
                      <CheckCircle2 size={18} /> Tandai Dana Dicairkan
                    </button>
                  )}

                  {(item.status === "DICAIRKAN" || item.status === "DITOLAK") && (
                    <div className="text-center md:text-right text-sm text-gray-500 italic flex items-center gap-2">
                      <FileText size={16} /> Selesai diproses
                    </div>
                  )}

                  {/* TOMBOL HAPUS (KHUSUS SUPERADMIN) */}
                  {userRole === "SUPERADMIN" && (
                    <button onClick={() => handleDelete(item.id, item.profiles?.nama_lengkap)} disabled={updatingId === item.id} className="mt-2 w-full md:w-auto flex items-center justify-center gap-2 bg-white border border-red-500 text-red-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-50 transition disabled:opacity-50">
                      <Trash2 size={18} /> Hapus Data
                    </button>
                  )}

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}