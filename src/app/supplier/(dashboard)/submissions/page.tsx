import { redirect } from 'next/navigation';

export default function SubmissionsRedirect() {
  // Fitur submit product untuk supplier ditiadakan sesuai arsitektur tersentralisasi.
  // Redirect otomatis ke dashboard utama jika user menggunakan bookmark lama.
  redirect('/supplier');
}
