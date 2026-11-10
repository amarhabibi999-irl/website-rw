"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

// Tambahin props isOpen dan setIsOpen
export default function Sidebar({ 
  role, 
  nama, 
  isOpen, 
  setIsOpen 
}: { 
  role: string; 
  nama: string; 
  isOpen: boolean; 
  setIsOpen: (val: boolean) => void;
}) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  // Fungsi buat nutup sidebar otomatis pas menu di klik (khusus di HP)
  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Overlay Gelap (Hanya muncul di HP pas sidebar kebuka) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar Utama */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0 md:flex
      `}>
                <div className="p-4 border-b border-gray-200 flex items-center gap-3">
          {/* TAMBAHIN LOGO DI SINI */}
          <img 
            src="/Logo RW 14 Pesona Kahuripan 9.png" 
            alt="Logo RW" 
            className="w-10 h-10 object-contain shrink-0" 
          />
          <div>
            <h2 className="text-sm font-bold text-blue-600 leading-tight">PORTAL RW 14 PESONA KAHURIPAN 9</h2>
            <p className="text-xs text-gray-500 mt-1">Halo, {nama} ({role})</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* MENU UNTUK SUPERADMIN & ADMIN */}
          {(role === "SUPERADMIN" || role === "ADMIN") && (
            <>
              <Link href="/" onClick={closeSidebar} className="block p-2 rounded hover:bg-blue-50 text-gray-700">Dashboard</Link>
              <Link href="/admin/keuangan" onClick={closeSidebar} className="block p-2 rounded hover:bg-blue-50 text-gray-700">Laporan Keuangan</Link>
              <Link href="/admin/pengaduan" onClick={closeSidebar} className="block p-2 rounded hover:bg-blue-50 text-gray-700">Layanan Pengaduan</Link>
              <Link href="/admin/kegiatan" onClick={closeSidebar} className="block p-2 rounded hover:bg-blue-50 text-gray-700">Kegiatan RW</Link>
              <Link href="/admin/pinjaman" onClick={closeSidebar} className="block p-2 rounded hover:bg-blue-50 text-gray-700">Pengajuan Pinjaman</Link>
              <Link href="/admin/ipl" onClick={closeSidebar} className="block p-2 rounded hover:bg-blue-50 text-gray-700">Laporan IPL</Link>
              <Link href="/admin/warga" onClick={closeSidebar} className="block p-2 rounded hover:bg-blue-50 text-gray-700">Data Warga</Link>
              <Link href="/admin/umkm" onClick={closeSidebar} className="block p-2 rounded hover:bg-blue-50 text-gray-700">UMKM Warga</Link>
            </>
          )}

          {/* MENU UNTUK WARGA */}
          {role === "WARGA" && (
          <>
            <Link href="/" onClick={closeSidebar} className="block p-2 rounded hover:bg-blue-50 text-gray-700">Dashboard</Link>
            <Link href="/warga/profil" onClick={closeSidebar} className="block p-2 rounded hover:bg-blue-50 text-gray-700">Profil Saya</Link>
            {/* TAMBAHIN INI */}
            <Link href="/warga/ipl" onClick={closeSidebar} className="block p-2 rounded hover:bg-blue-50 text-gray-700">Iuran IPL</Link>
            <Link href="/warga/pinjaman" onClick={closeSidebar} className="block p-2 rounded hover:bg-blue-50 text-gray-700">Layanan Pinjaman</Link>
            <Link href="/warga/pengaduan" onClick={closeSidebar} className="block p-2 rounded hover:bg-blue-50 text-gray-700">Layanan Pengaduan</Link>
          </>
          )}

          {/* MENU UNTUK SECURITY */}
          {role === "SECURITY" && (
            <>
              <Link href="/" onClick={closeSidebar} className="block p-2 rounded hover:bg-blue-50 text-gray-700">Dashboard</Link>
              <Link href="/security/pengaduan" onClick={closeSidebar} className="block p-2 rounded hover:bg-blue-50 text-gray-700">Pengaduan Masuk</Link>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button onClick={handleLogout} className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600">
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}