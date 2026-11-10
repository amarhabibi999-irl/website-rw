"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, ShieldAlert, User, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function AdminPengaduanPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pengaduanList, setPengaduanList] = useState<any[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  const fetchSemuaPengaduan = async () => {
    // Ambil data pengaduan beserta data profil warganya (JOIN)
    const { data, error } = await supabase
      .from("pengaduan")
      .select(`
        *,
        profiles (
          nama_lengkap,
          no_hp
        )
      `)
      .order("created_at", { ascending: false });
      
    if (data) setPengaduanList(data);
    if (error) console.error(error);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      
      // Cek role, pastikan yang masuk admin (opsional, biar aman)
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
      if (profile?.role !== 'ADMIN' && profile?.role !== 'SUPERADMIN') {
        alert("Akses ditolak! Anda bukan Admin.");
        router.push("/");
        return;
      }

      setUserId(session.user.id);
      await fetchSemuaPengaduan();
      setLoading(false);
    };
    init();
  }, [router, supabase]);

  const handleForward = async (id: string) => {
    setUpdatingId(id);
    const { error } = await supabase
      .from("pengaduan")
      .update({ status: "DIPROSES" }) // Kita ubah jadi DIPROSES (artinya udah di-forward ke security)
      .eq("id", id);

    if (error) {
      alert("Gagal update status: " + error.message);
    } else {
      await fetchSemuaPengaduan(); // Refresh list
    }
    setUpdatingId(null);
  };

  if (loading) return <div className="p-8 text-center text-blue-600 font-bold">Memuat Data Pengaduan...</div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-2">
        <ArrowLeft size={20} /> Kembali ke Dashboard
      </Link>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6 border-b pb-4">
          <ShieldAlert size={28} className="text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Daftar Pengaduan Warga</h1>
            <p className="text-sm text-gray-500">Kelola dan teruskan laporan ke pihak Security.</p>
          </div>
        </div>

        {pengaduanList.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Belum ada pengaduan dari warga.</p>
        ) : (
          <div className="space-y-4">
            {pengaduanList.map((item) => (
              <div key={item.id} className="border border-gray-200 p-4 md:p-5 rounded-xl bg-gray-50 flex flex-col md:flex-row gap-5">
                
                {/* Konten Pengaduan */}
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{item.judul}</h3>
                    <p className="text-sm text-gray-600 mt-1">{item.deskripsi}</p>
                  </div>
                  
                  {item.foto_url && (
                    <img src={item.foto_url} alt="Bukti" className="rounded-lg max-h-48 object-cover border border-gray-200" />
                  )}
                  
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500 bg-white p-2 rounded-md inline-flex">
                    <span className="flex items-center gap-1"><User size={14}/> {item.profiles?.nama_lengkap || "Warga"}</span>
                    <span className="flex items-center gap-1"><MessageSquare size={14}/> {item.profiles?.no_hp || "No HP -"}</span>
                  </div>
                </div>

                {/* Status & Aksi */}
                <div className="shrink-0 flex flex-col items-start md:items-end justify-between border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-5">
                  <div className="mb-4">
                    {item.status === "BARU" && <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-full text-xs font-bold"><Clock size={14}/> Menunggu</span>}
                    {item.status === "DIPROSES" && <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold"><ShieldAlert size={14}/> Diteruskan ke Security</span>}
                    {item.status === "SELESAI" && <span className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold"><CheckCircle2 size={14}/> Selesai</span>}
                  </div>

                  {item.status === "BARU" && (
                    <button 
                      onClick={() => handleForward(item.id)}
                      disabled={updatingId === item.id}
                      className="w-full md:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
                    >
                      {updatingId === item.id ? "Memproses..." : "Forward ke Security ➔"}
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