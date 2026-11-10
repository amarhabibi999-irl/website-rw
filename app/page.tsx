"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import { 
  TrendingUp, TrendingDown, Wallet, Menu, CalendarDays, Megaphone, 
  ArrowRight, ShieldAlert, AlertCircle, CheckCircle2, FileText 
} from "lucide-react";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // State Keuangan & Notifikasi
  const [securityPendingCount, setSecurityPendingCount] = useState(0);
  const [totalMasuk, setTotalMasuk] = useState(0);
  const [totalKeluar, setTotalKeluar] = useState(0);
  const [saldoKas, setSaldoKas] = useState(0);

  // State IPL
  const [iplStatus, setIplStatus] = useState<"BELUM" | "MENUNGGU" | "LUNAS" | "NONE">("NONE");
  const [iplDetail, setIplDetail] = useState<any>(null);

  // State Kegiatan & UMKM
  const [kegiatanList, setKegiatanList] = useState<any[]>([]);
  const [umkmList, setUmkmList] = useState<any[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0); // Buat Slider Iklan

  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    const initData = async () => {
      const timeoutId = setTimeout(() => { if (isMounted) setLoading(false); }, 3000);

      try {
        const { data: { session } } = await supabase.auth.getSession();

        // 1. Tarik Data Keuangan
        const { data: keuanganData } = await supabase.from("laporan_keuangan").select("tipe, nominal");
        if (keuanganData) {
          let masuk = 0; let keluar = 0;
          keuanganData.forEach((item) => {
            if (item.tipe === "PEMASUKAN") masuk += Number(item.nominal);
            if (item.tipe === "PENGELUARAN") keluar += Number(item.nominal);
          });
          setTotalMasuk(masuk); setTotalKeluar(keluar); setSaldoKas(masuk - keluar);
        }

        // 2. Tarik Data Kegiatan Terbaru
        const { data: kegiatanData } = await supabase.from("kegiatan").select("*").order("tanggal", { ascending: false }).limit(3);
        if (kegiatanData && isMounted) setKegiatanList(kegiatanData);

        // 3. Tarik Data Iklan UMKM Aktif
        const today = new Date().toISOString().split('T')[0];
        const { data: umkmData } = await supabase
          .from("umkm_iklan")
          .select("*")
          .eq("is_active", true)
          .gte("masa_berlaku_selesai", today)
          .order("created_at", { ascending: false });
        if (umkmData && isMounted) setUmkmList(umkmData);

        // 4. Cek Sesi User & Profil
        if (session) {
          if (!isMounted) return;
          setUser(session.user);
          
          const { data } = await supabase.from("profiles").select("role, nama_lengkap").eq("id", session.user.id).single();
          
          if (data && isMounted) {
            setProfile(data);

            // Notifikasi Security
            if (data.role === "SECURITY") {
              const { count } = await supabase.from("pengaduan").select("*", { count: "exact", head: true }).eq("status", "DIPROSES");
              if (isMounted) setSecurityPendingCount(count || 0);
            }

            // Notifikasi IPL Warga
            if (data.role === "WARGA") {
              const { data: iplData } = await supabase.from("ipl_tagihan").select("*").eq("profile_id", session.user.id).order("created_at", { ascending: false });
              if (iplData && iplData.length > 0) {
                const belumBayar = iplData.find(i => i.status === "BELUM");
                const menunggu = iplData.find(i => i.status === "MENUNGGU_KONFIRMASI");
                if (belumBayar) { setIplStatus("BELUM"); setIplDetail(belumBayar); }
                else if (menunggu) { setIplStatus("MENUNGGU"); setIplDetail(menunggu); }
                else { setIplStatus("LUNAS"); }
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        clearTimeout(timeoutId);
        if (isMounted) setLoading(false);
      }
    };

    initData();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setUser(session.user);
        const { data } = await supabase.from("profiles").select("role, nama_lengkap").eq("id", session.user.id).single();
        if (data) setProfile(data);
      } else {
        setUser(null); setProfile(null);
      }
    });

    return () => { isMounted = false; authListener.subscription.unsubscribe(); };
  }, []);

  // LOGIKA SLIDER IKLAN (Ganti gambar tiap 3 detik)
  useEffect(() => {
    if (umkmList.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % umkmList.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [umkmList]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500 font-medium">Memuat Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {user && profile && (
        <Sidebar role={profile.role} nama={profile.nama_lengkap} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-4 shadow-lg flex justify-between items-center sticky top-0 z-30">
                    <div className="flex items-center gap-3">
            {user && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-1 rounded-md hover:bg-white/20 transition focus:outline-none"
              >
                <Menu size={24} />
              </button>
            )}
            
            {/* TAMBAHIN LOGO DI SINI */}
            <img 
              src="/Logo RW 14 Pesona Kahuripan 9.png" 
              alt="Logo RW" 
              className="w-8 h-8 md:w-10 md:h-10 object-contain bg-white rounded-full p-0.5" 
            />
            
            <h1 className="text-xl font-bold tracking-wide">PORTAL RW 14-PK 9</h1>
          </div>
          
          {!user ? (
            <div className="flex gap-2">
              <Link href="/login" className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/20 transition">Login</Link>
              <Link href="/register" className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition shadow-sm">Daftar</Link>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">{profile?.nama_lengkap?.charAt(0).toUpperCase()}</div>
              <span className="text-sm font-medium hidden sm:block">{profile?.nama_lengkap}</span>
            </div>
          )}
        </header>

        <main className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6">
          
          {/* BANNER NOTIFIKASI SECURITY */}
          {user && profile?.role === "SECURITY" && securityPendingCount > 0 && (
            <Link href="/security/pengaduan" className="block bg-red-50 border-l-4 border-red-500 p-5 rounded-xl shadow-sm hover:bg-red-100 transition group">
              <div className="flex items-start md:items-center gap-4">
                <div className="bg-red-100 p-3 rounded-full text-red-600 group-hover:scale-110 transition-transform"><ShieldAlert size={28} /></div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-red-800">Ada {securityPendingCount} Pengaduan Baru!</h3>
                  <p className="text-sm text-red-600 mt-1">Admin telah meneruskan laporan warga. Silakan klik di sini.</p>
                </div>
                <ArrowRight className="text-red-400 hidden md:block" />
              </div>
            </Link>
          )}

          {/* BANNER NOTIFIKASI IPL WARGA */}
          {user && profile?.role === "WARGA" && iplStatus === "BELUM" && (
            <Link href="/warga/ipl" className="block bg-orange-50 border-l-4 border-orange-500 p-5 rounded-xl shadow-sm hover:bg-orange-100 transition group">
              <div className="flex items-start md:items-center gap-4">
                <div className="bg-orange-100 p-3 rounded-full text-orange-600 group-hover:scale-110 transition-transform"><AlertCircle size={28} /></div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-orange-800">Reminder: IPL Belum Dibayar!</h3>
                  <p className="text-sm text-orange-600 mt-1">Tagihan IPL bulan {iplDetail?.bulan} sebesar Rp {iplDetail?.nominal.toLocaleString('id-ID')} belum dibayar. Klik untuk upload bukti.</p>
                </div>
                <ArrowRight className="text-orange-400 hidden md:block" />
              </div>
            </Link>
          )}
          {user && profile?.role === "WARGA" && iplStatus === "MENUNGGU" && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-5 rounded-xl shadow-sm">
              <div className="flex items-start md:items-center gap-4">
                <div className="bg-yellow-100 p-3 rounded-full text-yellow-600"><FileText size={28} /></div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-yellow-800">Bukti Transfer Sedang Diverifikasi</h3>
                  <p className="text-sm text-yellow-600 mt-1">Bukti pembayaran IPL bulan {iplDetail?.bulan} sedang dicek Admin.</p>
                </div>
              </div>
            </div>
          )}
          {user && profile?.role === "WARGA" && iplStatus === "LUNAS" && (
            <div className="bg-green-50 border-l-4 border-green-500 p-5 rounded-xl shadow-sm">
              <div className="flex items-start md:items-center gap-4">
                <div className="bg-green-100 p-3 rounded-full text-green-600"><CheckCircle2 size={28} /></div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-green-800">IPL SUDAH BAYAR (LUNAS)</h3>
                  <p className="text-sm text-green-600 mt-1">Terima kasih atas partisipasi Anda.</p>
                </div>
              </div>
            </div>
          )}

          {/* KARTU STATISTIK KEUANGAN */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute -right-4 -top-4 bg-green-50 p-4 rounded-full group-hover:scale-110 transition-transform"><TrendingUp size={40} className="text-green-500 opacity-50" /></div>
              <p className="text-gray-500 text-sm font-medium">Total Pemasukan</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">Rp {totalMasuk.toLocaleString('id-ID')}</h3>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute -right-4 -top-4 bg-red-50 p-4 rounded-full group-hover:scale-110 transition-transform"><TrendingDown size={40} className="text-red-500 opacity-50" /></div>
              <p className="text-gray-500 text-sm font-medium">Total Pengeluaran</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">Rp {totalKeluar.toLocaleString('id-ID')}</h3>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute -right-4 -top-4 bg-blue-50 p-4 rounded-full group-hover:scale-110 transition-transform"><Wallet size={40} className="text-blue-500 opacity-50" /></div>
              <p className="text-gray-500 text-sm font-medium">Saldo Kas RW</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">Rp {saldoKas.toLocaleString('id-ID')}</h3>
            </div>
          </section>

          {/* SECTION KEGIATAN & UMKM SLIDER */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* INFO KEGIATAN RW */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4 border-b pb-3">
                <CalendarDays size={20} className="text-blue-600" />
                <h2 className="text-lg font-bold text-gray-800">Info Seputar RW</h2>
              </div>
              
              {kegiatanList.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-6">Belum ada info terbaru.</p>
              ) : (
                <div className="space-y-4">
                  {kegiatanList.map((kegiatan) => (
                    <div key={kegiatan.id} className="flex gap-4 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition">
                      {kegiatan.gambar_url && <img src={kegiatan.gambar_url} alt="Info" className="w-20 h-20 object-cover rounded-lg border border-gray-200 shrink-0" />}
                      <div>
                        <p className="text-xs font-bold text-blue-600 mb-1">{new Date(kegiatan.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        <h3 className="font-bold text-gray-800 text-sm leading-tight">{kegiatan.judul}</h3>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">{kegiatan.deskripsi}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SLIDER IKLAN UMKM */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <div className="flex items-center gap-2 mb-4 border-b pb-3">
                <Megaphone size={20} className="text-blue-600" />
                <h2 className="text-lg font-bold text-gray-800">Iklan Warga (UMKM)</h2>
              </div>
              
              <div className="flex-1 relative min-h-[180px] rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                {umkmList.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                    <div className="bg-white p-3 rounded-full shadow-sm mb-2"><Megaphone size={24} className="text-gray-400" /></div>
                    <p className="text-gray-600 font-medium text-sm">Space Iklan Tersedia</p>
                    <p className="text-xs text-gray-400 mt-1">Hubungi admin untuk memasang iklan.</p>
                  </div>
                ) : (
                  umkmList.map((iklan, index) => (
                    <div 
                      key={iklan.id} 
                      className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentAdIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                    >
                      <img src={iklan.gambar_url} alt={iklan.judul} className="w-full h-full object-cover" />
                      
                      {/* Overlay Info */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-10">
                        <h3 className="text-white font-bold text-lg leading-tight drop-shadow-md">{iklan.judul}</h3>
                        <p className="text-green-400 font-bold drop-shadow-md">Rp {iklan.harga_produk.toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Indicator Dots */}
              {umkmList.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-3">
                  {umkmList.map((_, idx) => (
                    <div key={idx} className={`h-1.5 rounded-full transition-all ${idx === currentAdIndex ? 'w-4 bg-blue-600' : 'w-1.5 bg-gray-300'}`} />
                  ))}
                </div>
              )}
            </div>

          </section>
        </main>
      </div>
    </div>
  );
}