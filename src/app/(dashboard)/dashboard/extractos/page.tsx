"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ExpenseRow {
  date: string;
  description: string;
  amount: number;
  category: string;
}

export default function ExtractosPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [omittedCount, setOmittedCount] = useState(0);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : data.categories || []))
      .catch((err) => console.error("Failed to load categories", err));
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setOmittedCount(0);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/extractos", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        const validExpenses = data.expenses.filter((e: any) => !e.isDuplicate);
        setOmittedCount(data.expenses.length - validExpenses.length);
        setExpenses(validExpenses);
      } else {
        setError(data.error || "Error al procesar el PDF");
      }
    } catch (err) {
      setError("Error de conexion al procesar el archivo.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (index: number, field: keyof ExpenseRow, value: string | number) => {
    const updated = [...expenses];
    updated[index] = { ...updated[index], [field]: value };
    setExpenses(updated);
  };

  const handleDelete = (index: number) => {
    const updated = [...expenses];
    updated.splice(index, 1);
    setExpenses(updated);
  };

  const handleSave = async () => {
    if (expenses.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/expenses/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expenses }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/dashboard");
      } else {
        setError(data.error || "Error al guardar los gastos");
      }
    } catch (err) {
      setError("Error de red al guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Importar Extracto Bancario</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Sube el PDF de tu extracto de cuenta o tarjeta de crédito. La IA identificará automáticamente los gastos.
        </p>
        
        <div className="flex items-center gap-4 flex-wrap">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 dark:file:bg-indigo-900/50 dark:file:text-indigo-400"
          />
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition min-w-[150px]"
          >
            {loading ? "Procesando..." : "Analizar PDF"}
          </button>
        </div>
        
        {omittedCount > 0 && (
          <p className="mt-4 text-yellow-700 text-sm font-medium bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
            Se omitieron {omittedCount} gasto(s) porque ya se encontraban registrados en la base de datos con la misma fecha y monto.
          </p>
        )}
        {error && <p className="mt-4 text-red-500 text-sm font-medium bg-red-50 dark:bg-red-900/30 p-3 rounded-lg border border-red-200 dark:border-red-800">{error}</p>}
      </div>

      {expenses.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
            <h2 className="font-semibold">Gastos Detectados ({expenses.length})</h2>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition text-sm font-medium shadow-sm"
            >
              {saving ? "Guardando..." : "Guardar Todos"}
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Descripción</th>
                  <th className="px-4 py-3 font-medium w-48">Categoría</th>
                  <th className="px-4 py-3 font-medium w-32">Monto</th>
                  <th className="px-4 py-3 font-medium w-20 text-center">Quitar</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {expenses.map((exp, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-4 py-2">
                      <input
                        type="date"
                        value={exp.date}
                        className="w-full bg-transparent border border-gray-200 dark:border-gray-600 rounded p-1.5 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm outline-none"
                        onChange={(e) => handleEdit(idx, "date", e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={exp.description}
                        className="w-full bg-transparent border border-gray-200 dark:border-gray-600 rounded p-1.5 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm outline-none"
                        onChange={(e) => handleEdit(idx, "description", e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={exp.category}
                        onChange={(e) => handleEdit(idx, "category", e.target.value)}
                        className="w-full bg-transparent border border-gray-200 dark:border-gray-600 rounded p-1.5 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm outline-none"
                      >
                        {categories.map((c) => (
                          <option key={c.id || c.name} value={c.name} className="dark:bg-gray-800">
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={exp.amount}
                        className="w-full bg-transparent border border-gray-200 dark:border-gray-600 rounded p-1.5 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm outline-none"
                        onChange={(e) => handleEdit(idx, "amount", parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => handleDelete(idx)}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition shadow-sm border border-transparent hover:border-red-200 dark:hover:border-red-800"
                        title="Eliminar fila"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
