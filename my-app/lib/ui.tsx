export const card = "rounded-2xl bg-white shadow-sm ring-1 ring-slate-200";
export const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";
export const btnPrimary =
  "rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60";
export const btnGhost =
  "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium transition hover:bg-slate-50 disabled:opacity-60";
export const btnDanger =
  "rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-60";

export const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

export function tgl(s: string) {
  const d = new Date(s.replace(" ", "T"));
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export const errMsg = (e: unknown) => (e instanceof Error ? e.message : "Terjadi kesalahan");

export function ErrorBox({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{message}</p>
  );
}

export function OkBox({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>
  );
}

export function Loading() {
  return <p className="py-16 text-center text-slate-400">Memuat...</p>;
}

const warna: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  lunas: "bg-emerald-100 text-emerald-700",
  batal: "bg-slate-200 text-slate-500",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${warna[status] ?? ""}`}>
      {status}
    </span>
  );
}