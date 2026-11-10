"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowLeft, UploadCloud, CheckCircle2, Clock, Wallet, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

export default function WargaIplPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [tagihan, setTagihan] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [rekening, setRekening] = useState({ nama_bank: "", nomor_rekening: "", atas_nama: "" });

  const supabase = createClient();
  const router = useRouter();

  const fetchTagihan = async (uid: string) => {
    const { data } = await supabase
      .from("ipl_tagihan")
      .select("*")
      .eq("profile_id", uid)
      .neq("status", "LUNAS")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
      
    if (data) setTagihan(data);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push("/login");
      
      setUserId(session.user.id);
      await fetchTagihan(session.user.id);

      // Tarik data rekening terbaru
      const { data: setting } = await supabase.from("pengaturan_rw").select("*").eq("id", 1).single();
      if (setting) setRekening(setting);

      setLoading(false);
    };
    init();
  }, [router, supabase]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !tagihan || !userId) return alert("Pilih foto bukti transfer dulu!");
    
    setSubmitting(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('ipl_bukti').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('ipl_bukti').getPublicUrl(fileName);

      const { error: updateError } = await supabase.from("ipl_tagihan").update({
        status: "MENUNGGU_KONFIRMASI",
        bukti_transfer_url: publicUrlData.publicUrl,
        tanggal_bayar: new Date().toISOString().split('T')[0]
      }).eq("id", tagihan.id);

      if (updateError) throw updateError;

      alert("Bukti transfer berhasil dikirim! Mohon tunggu konfirmasi Admin.");
      router.push("/");
      
    } catch (error: any) {
      alert("Gagal upload: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-blue-600 font-bold">Memuat...</div>;

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto w-full space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-2">
        <ArrowLeft size={20} /> Kembali ke Dashboard
      </Link>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6 border-b pb-4">
          <Wallet size={28} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Iuran IPL</h1>
        </div>

        {!tagihan ? (
          <div className="text-center py-10">
            <CheckCircle2 size={60} className="mx-auto text-green-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-800">IPL SUDAH BAYAR</h2>
            <p className="text-gray-500 mt-2">Tidak ada tagihan yang perlu dibayar saat ini.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-orange-50 border border-orange-200 p-5 rounded-xl text-center">
              <p className="text-sm font-semibold text-orange-700 mb-1">Tagihan Bulan {tagihan.bulan} {tagihan.tahun}</p>
              <h2 className="text-3xl font-bold text-orange-900">Rp {tagihan.nominal.toLocaleString('id-ID')}</h2>
              <p className="text-xs text-orange-600 mt-2">Status: {tagihan.status === 'BELUM' ? 'Belum Dibayar' : 'Menunggu Konfirmasi'}</p>
            </div>

            {tagihan.status === "BELUM" ? (
              <>
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                  <h3 className="font-bold text-gray-800 mb-2">Instruksi Pembayaran:</h3>
                  <p className="text-sm text-gray-600 mb-3">Silakan transfer tepat sebesar nominal di atas ke rekening berikut:</p>
                  
                  {/* TAMPILAN REKENING DINAMIS */}
                  <div className="bg-white p-3 rounded-lg border border-gray-300 font-mono text-center mb-3">
                    <p className="text-sm text-gray-500">{rekening.nama_bank || "Memuat..."}</p>
                    <p className="text-xl font-bold text-blue-800 tracking-wider">{rekening.nomor_rekening || "..."}</p>
                    <p className="text-sm text-gray-500">a.n {rekening.atas_nama || "..."}</p>
                  </div>
                </div>

                <form onSubmit={handleUpload} className="space-y-4 border-t pt-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Bukti Transfer (Wajib)</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition relative">
                      <input type="file" accept="image/*" required onChange={(e) => setFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <ImageIcon size={32} className="text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 font-medium text-center">
                        {file ? file.name : "Klik atau Tarik Foto ke Sini"}
                      </p>
                    </div>
                  </div>
                  <button type="submit" disabled={submitting} className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:bg-gray-400">
                    <UploadCloud size={20} /> {submitting ? "Mengirim Bukti..." : "Kirim Bukti & Konfirmasi"}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-6 bg-yellow-50 rounded-xl border border-yellow-200">
                <Clock size={40} className="mx-auto text-yellow-500 mb-2" />
                <p className="font-bold text-yellow-700">Menunggu Konfirmasi Admin</p>
                <p className="text-sm text-yellow-600 mt-1">Bukti transfer lo udah masuk. Admin bakal segera ngecek.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}