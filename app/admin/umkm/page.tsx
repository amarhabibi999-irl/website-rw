"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowLeft, Store, PlusCircle, Trash2, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

export default function AdminUmkmPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [umkmList, setUmkmList] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>("");
  
  // State Form
  const [judul, setJudul] = useState("");
  const [harga, setHarga] = useState("");
  const [tglMulai, setTglMulai] = useState(new Date().toISOString().split('T')[0]);
  const [tglSelesai, setTglSelesai] = useState(new Date().toISOString().split('T')[0]);
  const [file, setFile] = useState<File | null>(null);

  const supabase = createClient();
  const router = useRouter();

  const fetchUmkm = async () => {
    const { data } = await supabase
      .from("umkm_iklan")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setUmkmList(data);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push("/login");
      
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
      if (profile?.role !== 'ADMIN' && profile?.role !== 'SUPERADMIN') return router.push("/");
      setUserRole(profile.role);

      await fetchUmkm();
      setLoading(false);
    };
    init();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert("Pilih gambar iklan dulu!");
    
    setSubmitting(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `umkm-${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('umkm_foto').upload(fileName, file);
      if (uploadError) throw uploadError;
      
      const { data: publicUrlData } = supabase.storage.from('umkm_foto').getPublicUrl(fileName);

      const { error } = await supabase.from("umkm_iklan").insert({
        judul,
        harga_produk: parseFloat(harga),
        masa_berlaku_mulai: tglMulai,
        masa_berlaku_selesai: tglSelesai,
        gambar_url: publicUrlData.publicUrl
      });

      if (error) throw error;

      alert("Iklan UMKM berhasil ditambahkan!");
      setJudul(""); setHarga(""); setFile(null);
      await fetchUmkm();
    } catch (error: any) {
      alert("Gagal menambah iklan: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin mau hapus iklan ini?")) return;
    const { error } = await supabase.from("umkm_iklan").delete().eq("id", id);
    if (error) alert("Gagal hapus: " + error.message);
    else await fetchUmkm();
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
              <PlusCircle size={20} className="text-blue-600"/> Tambah Iklan UMKM
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Judul Produk/Jasa</label>
                <input type="text" required value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Contoh: Kue Kering Lebaran" className="w-full border border-gray-300 rounded-lg p-2 text-sm text-black focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Harga Produk (Rp)</label>
                <input type="number" required value={harga} onChange={(e) => setHarga(e.target.value)} placeholder="Contoh: 50000" className="w-full border border-gray-300 rounded-lg p-2 text-sm text-black focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tgl Mulai</label>
                  <input type="date" required value={tglMulai} onChange={(e) => setTglMulai(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-xs text-black focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tgl Selesai</label>
                  <input type="date" required value={tglSelesai} onChange={(e) => setTglSelesai(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-xs text-black focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Foto Produk (Wajib)</label>
                <div className="border border-gray-300 rounded-lg p-2 bg-gray-50 flex items-center gap-2">
                  <ImageIcon size={20} className="text-gray-400" />
                  <input type="file" accept="image/*" required onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200" />
                </div>
              </div>
              <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 transition disabled:bg-gray-400">
                {submitting ? "Menyimpan..." : "Tayangkan Iklan"}
              </button>
            </form>
          </div>
        </div>

        {/* LIST UMKM */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
              <Store size={20} className="text-blue-600"/> Daftar Iklan Tayang
            </h2>
            
            {umkmList.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Belum ada iklan UMKM.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {umkmList.map((item) => (
                  <div key={item.id} className="flex flex-col border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition">
                    <img src={item.gambar_url} alt="Produk" className="w-full h-40 object-cover" />
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-gray-800">{item.judul}</h3>
                          {userRole === "SUPERADMIN" && (
                            <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                        <p className="text-lg font-bold text-blue-600 mt-1">Rp {item.harga_produk.toLocaleString('id-ID')}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 bg-gray-100 p-1.5 rounded text-center">
                        Tayang: {new Date(item.masa_berlaku_mulai).toLocaleDateString('id-ID')} s/d {new Date(item.masa_berlaku_selesai).toLocaleDateString('id-ID')}
                      </p>
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