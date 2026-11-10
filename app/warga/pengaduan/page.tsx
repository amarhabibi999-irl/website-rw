"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageSquarePlus, Send, Clock, CheckCircle2, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

export default function PengaduanWargaPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [file, setFile] = useState<File | null>(null); // State buat foto
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [riwayat, setRiwayat] = useState<any[]>([]);

  const supabase = createClient();
  const router = useRouter();

  const fetchRiwayat = async (uid: string) => {
    const { data } = await supabase
      .from("pengaduan")
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
      await fetchRiwayat(session.user.id);
      setLoading(false);
    };
    init();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSubmitting(true);

    let foto_url = null;

    try {
      // 1. Kalau ada foto yang dipilih, upload dulu ke Storage
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('pengaduan_foto')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // 2. Ambil link publik fotonya
        const { data: publicUrlData } = supabase.storage
          .from('pengaduan_foto')
          .getPublicUrl(fileName);
        
        foto_url = publicUrlData.publicUrl;
      }

      // 3. Simpan data pengaduan ke database
      const { error } = await supabase.from("pengaduan").insert({
        profile_id: userId,
        judul,
        deskripsi,
        status: "BARU",
        foto_url: foto_url
      });

      if (error) throw error;

      alert("Pengaduan berhasil dikirim!");
      setJudul("");
      setDeskripsi("");
      setFile(null);
      await fetchRiwayat(userId);
    } catch (error: any) {
      alert("Gagal kirim pengaduan: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "BARU") return <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold"><Clock size={14}/> Menunggu</span>;
    if (status === "DIPROSES") return <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold"><Clock size={14}/> Diproses</span>;
    return <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold"><CheckCircle2 size={14}/> Selesai</span>;
  };

  if (loading) return <div className="p-8 text-center text-blue-600 font-bold">Memuat...</div>;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto w-full space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-2">
        <ArrowLeft size={20} /> Kembali ke Dashboard
      </Link>

      {/* FORM PENGADUAN */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6 border-b pb-4">
          <MessageSquarePlus size={28} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Buat Pengaduan Baru</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Judul Pengaduan</label>
            <input type="text" required value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Contoh: Lampu Jalan RT 01 Mati" className="w-full border border-gray-300 rounded-lg p-2.5 text-black focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Detail Kejadian / Masalah</label>
            <textarea required rows={4} value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} placeholder="Jelaskan sedetail mungkin..." className="w-full border border-gray-300 rounded-lg p-2.5 text-black focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
          </div>

          {/* INPUT FOTO */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Lampiran Foto (Opsional)</label>
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-2 bg-gray-50">
              <ImageIcon size={20} className="text-gray-400 ml-2" />
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
              />
            </div>
          </div>

          <button type="submit" disabled={submitting} className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:bg-gray-400">
            <Send size={18} />
            {submitting ? "Mengirim..." : "Kirim Pengaduan"}
          </button>
        </form>
      </div>

      {/* RIWAYAT PENGADUAN */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Riwayat Pengaduan Saya</h2>
        
        {riwayat.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Belum ada pengaduan.</p>
        ) : (
          <div className="space-y-4">
            {riwayat.map((item) => (
              <div key={item.id} className="border border-gray-100 p-4 rounded-xl bg-gray-50 flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800">{item.judul}</h3>
                  <p className="text-sm text-gray-600 mt-1">{item.deskripsi}</p>
                  
                  {/* Tampilin foto kalau ada */}
                  {item.foto_url && (
                    <img src={item.foto_url} alt="Bukti Foto" className="mt-3 rounded-lg max-h-48 object-cover border border-gray-200" />
                  )}

                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
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