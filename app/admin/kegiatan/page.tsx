"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, PlusCircle, Trash2, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

export default function AdminKegiatanPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [kegiatanList, setKegiatanList] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>("");
  
  // State Form
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [file, setFile] = useState<File | null>(null);

  const supabase = createClient();
  const router = useRouter();

  const fetchKegiatan = async () => {
    const { data } = await supabase
      .from("kegiatan")
      .select("*")
      .order("tanggal", { ascending: false });
    if (data) setKegiatanList(data);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push("/login");
      
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
      if (profile?.role !== 'ADMIN' && profile?.role !== 'SUPERADMIN') return router.push("/");
      setUserRole(profile.role);

      await fetchKegiatan();
      setLoading(false);
    };
    init();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let gambar_url = null;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `kegiatan-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('kegiatan_foto').upload(fileName, file);
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage.from('kegiatan_foto').getPublicUrl(fileName);
        gambar_url = publicUrlData.publicUrl;
      }

      const { error } = await supabase.from("kegiatan").insert({
        judul,
        deskripsi,
        tanggal,
        gambar_url
      });

      if (error) throw error;

      alert("Kegiatan berhasil ditambahkan!");
      setJudul(""); setDeskripsi(""); setFile(null);
      await fetchKegiatan();
    } catch (error: any) {
      alert("Gagal menambah kegiatan: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin mau hapus info kegiatan ini?")) return;
    const { error } = await supabase.from("kegiatan").delete().eq("id", id);
    if (error) alert("Gagal hapus: " + error.message);
    else await fetchKegiatan();
  };

  if (loading) return <div className="p-8 text-center text-blue-600 font-bold">Memuat...</div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-2">
        <ArrowLeft size={20} /> Kembali ke Dashboard
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* FORM INPUT */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
              <PlusCircle size={20} className="text-blue-600"/> Buat Info Baru
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Judul Info / Kegiatan</label>
                <input type="text" required value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Contoh: Kerja Bakti HUT RI" className="w-full border border-gray-300 rounded-lg p-2 text-sm text-black focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Pelaksanaan</label>
                <input type="date" required value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm text-black focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Deskripsi Singkat</label>
                <textarea required rows={3} value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} placeholder="Jelaskan detail kegiatannya..." className="w-full border border-gray-300 rounded-lg p-2 text-sm text-black focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Foto/Poster (Wajib)</label>
                <div className="border border-gray-300 rounded-lg p-2 bg-gray-50 flex items-center gap-2">
                  <ImageIcon size={20} className="text-gray-400" />
                  <input type="file" accept="image/*" required onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200" />
                </div>
              </div>
              <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 transition disabled:bg-gray-400">
                {submitting ? "Menyimpan..." : "Publikasikan Info"}
              </button>
            </form>
          </div>
        </div>

        {/* LIST KEGIATAN */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
              <CalendarDays size={20} className="text-blue-600"/> Daftar Info & Kegiatan
            </h2>
            
            {kegiatanList.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Belum ada info kegiatan.</p>
            ) : (
              <div className="space-y-4">
                {kegiatanList.map((item) => (
                  <div key={item.id} className="flex flex-col md:flex-row gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white transition">
                    {item.gambar_url && (
                      <img src={item.gambar_url} alt="Poster" className="w-full md:w-32 h-32 object-cover rounded-lg border border-gray-200" />
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-blue-600 mb-1">
                            {new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                          <h3 className="font-bold text-lg text-gray-800">{item.judul}</h3>
                        </div>
                        {userRole === "SUPERADMIN" && (
                          <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600 p-2">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{item.deskripsi}</p>
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