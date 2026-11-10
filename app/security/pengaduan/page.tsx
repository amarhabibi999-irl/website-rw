"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowLeft, Shield, CheckCircle2, Clock, MapPin, User, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function SecurityPengaduanPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pengaduanList, setPengaduanList] = useState<any[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  const fetchTugasSecurity = async () => {
    // Security cuma butuh lihat yang statusnya DIPROSES atau SELESAI
    const { data, error } = await supabase
      .from("pengaduan")
      .select(`
        *,
        profiles (
          nama_lengkap,
          no_hp,
          alamat_darurat
        )
      `)
      .in("status", ["DIPROSES", "SELESAI"])
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
      
      // Pastikan yang masuk beneran Security atau Admin
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
      if (profile?.role !== 'SECURITY' && profile?.role !== 'SUPERADMIN') {
        alert("Akses ditolak! Anda bukan Security.");
        router.push("/");
        return;
      }

      setUserId(session.user.id);
      await fetchTugasSecurity();
      setLoading(false);
    };
    init();
  }, [router, supabase]);

  const handleSelesai = async (id: string) => {
    if (!confirm("Yakin laporan ini sudah selesai ditangani?")) return;
    
    setUpdatingId(id);
    const { error } = await supabase
      .from("pengaduan")
      .update({ status: "SELESAI" })
      .eq("id", id);

    if (error) {
      alert("Gagal update status: " + error.message);
    } else {
      await fetchTugasSecurity(); // Refresh list
    }
    setUpdatingId(null);
  };

  if (loading) return <div className="p-8 text-center text-blue-600 font-bold">Memuat Tugas...</div>;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-2">
        <ArrowLeft size={20} /> Kembali ke Dashboard
      </Link>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6 border-b pb-4">
          <Shield size={28} className="text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Tugas Keamanan (Pengaduan)</h1>
            <p className="text-sm text-gray-500">Daftar laporan dari Admin yang harus ditindaklanjuti.</p>
          </div>
        </div>

        {pengaduanList.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Shield size={48} className="mx-auto text-gray-300 mb-3" />
            <p>Belum ada tugas pengaduan yang masuk.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pengaduanList.map((item) => (
              <div key={item.id} className={`border p-4 md:p-5 rounded-xl flex flex-col md:flex-row gap-5 ${item.status === 'SELESAI' ? 'bg-gray-50 border-gray-200 opacity-75' : 'bg-white border-blue-200 shadow-sm'}`}>
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className={item.status === 'SELESAI' ? 'text-gray-400' : 'text-orange-500'} size={20} />
                    <div>
                      <h3 className={`font-bold text-lg ${item.status === 'SELESAI' ? 'text-gray-600 line-through' : 'text-gray-800'}`}>{item.judul}</h3>
                      <p className="text-sm text-gray-600 mt-1">{item.deskripsi}</p>
                    </div>
                  </div>
                  
                  {item.foto_url && (
                    <img src={item.foto_url} alt="Bukti" className="rounded-lg max-h-48 object-cover border border-gray-200" />
                  )}
                  
                  <div className="bg-gray-100 p-3 rounded-lg text-sm text-gray-700 space-y-1">
                    <p className="flex items-center gap-2 font-semibold"><User size={16}/> Pelapor: {item.profiles?.nama_lengkap}</p>
                    <p className="flex items-center gap-2"><MapPin size={16}/> Alamat: {item.profiles?.alamat_darurat || "Tidak ada data"}</p>
                    <p className="flex items-center gap-2"><Clock size={16}/> HP: {item.profiles?.no_hp || "Tidak ada data"}</p>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-start md:items-end justify-center border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-5">
                  {item.status === "DIPROSES" ? (
                    <button 
                      onClick={() => handleSelesai(item.id)}
                      disabled={updatingId === item.id}
                      className="w-full md:w-auto flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
                    >
                      <CheckCircle2 size={18} />
                      {updatingId === item.id ? "Menyimpan..." : "Tandai Selesai"}
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold">
                      <CheckCircle2 size={14}/> Sudah Selesai
                    </span>
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