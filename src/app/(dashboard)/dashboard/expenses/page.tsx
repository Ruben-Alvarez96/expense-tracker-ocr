"use client";

import { useEffect, useState } from "react";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
  receipt: string | null;
  category: Category;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ amount: "", description: "", date: "", categoryId: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [categorizing, setCategorizing] = useState(false);
  const [filterCat, setFilterCat] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadExpenses();
    fetch("/api/categories").then((r) => r.json()).then(setCategories);
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [filterCat]);

  function loadExpenses() {
    const params = new URLSearchParams();
    if (filterCat) params.set("categoryId", filterCat);
    fetch(`/api/expenses?${params}`).then((r) => r.json()).then(data => {
      setExpenses(data);
      setSelectedIds(new Set());
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await fetch(`/api/expenses/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        setEditId(null);
      } else {
        await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      setForm({ amount: "", description: "", date: "", categoryId: "" });
      loadExpenses();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminar este gasto?")) return;
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    loadExpenses();
  }

  function toggleAll() {
    if (selectedIds.size === expenses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(expenses.map(e => e.id)));
    }
  }

  function toggleOne(id: string) {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  }

  async function handleBulkDelete() {
    if (!confirm(`¿Estás seguro de eliminar ${selectedIds.size} gastos seleccionados?`)) return;
    setLoading(true);
    try {
      await fetch('/api/expenses/bulk-delete', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      });
      loadExpenses();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(exp: Expense) {
    setEditId(exp.id);
    setForm({
      amount: String(exp.amount),
      description: exp.description,
      date: exp.date.split("T")[0],
      categoryId: exp.category.id,
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gastos</h1>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700 space-y-4">
        <h2 className="font-semibold">{editId ? "Editar Gasto" : "Nuevo Gasto"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            type="number"
            step="0.01"
            placeholder="Monto"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="px-4 py-2 border dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 dark:text-gray-100"
            required
          />
          <input
            type="text"
            placeholder="Descripcion"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="px-4 py-2 border dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 dark:text-gray-100"
            required
          />
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="px-4 py-2 border dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 dark:text-gray-100"
          />
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="px-4 py-2 border dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 dark:text-gray-100"
            required
          >
            <option value="">Categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
            {editId ? "Actualizar" : "Agregar"}
          </button>
          <button
            type="button"
            disabled={categorizing || !form.description}
            onClick={async () => {
              setCategorizing(true);
              try {
                const res = await fetch("/api/categorize", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ description: form.description, amount: form.amount }),
                });
                const data = await res.json();
                const catMatch = categories.find((c) => c.name === data.category);
                if (catMatch) setForm((f) => ({ ...f, categoryId: catMatch.id }));
              } finally {
                setCategorizing(false);
              }
            }}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
          >
            {categorizing ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Analizando...
              </>
            ) : (
              "Auto-categorizar con IA"
            )}
          </button>
          {editId && (
            <button type="button" onClick={() => { setEditId(null); setForm({ amount: "", description: "", date: "", categoryId: "" }); }} className="px-6 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-500">
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700">
        <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold">Lista de Gastos</h2>
            {selectedIds.size > 0 && (
              <button 
                onClick={handleBulkDelete} 
                disabled={loading} 
                className="text-sm bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 px-3 py-1.5 rounded-md transition font-medium"
              >
                {loading ? "Eliminando..." : `Eliminar ${selectedIds.size} seleccionados`}
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            {expenses.length > 0 && (
              <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-indigo-600 transition">
                <input 
                  type="checkbox" 
                  checked={selectedIds.size === expenses.length && expenses.length > 0} 
                  onChange={toggleAll} 
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" 
                />
                <span className="font-medium">Seleccionar Todos</span>
              </label>
            )}
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="text-sm px-3 py-1.5 border dark:border-gray-600 rounded-lg outline-none bg-white dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="">Todas las categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        {expenses.length === 0 ? (
          <p className="p-6 text-gray-400 text-sm">No hay gastos registrados</p>
        ) : (
          <div className="divide-y dark:divide-gray-700">
            {expenses.map((exp) => (
              <div key={exp.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                <div className="flex items-center gap-4">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.has(exp.id)} 
                    onChange={() => toggleOne(exp.id)} 
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" 
                  />
                  {exp.receipt ? (
                    <a href={exp.receipt} target="_blank" rel="noopener noreferrer">
                      <img src={exp.receipt} alt="Recibo" className="w-10 h-10 rounded object-cover border dark:border-gray-600 hover:opacity-80" />
                    </a>
                  ) : (
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: exp.category.color }} />
                  )}
                  <div>
                    <p className="font-medium">{exp.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {exp.category.name} - {new Date(exp.date).toLocaleDateString("es")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-lg">${exp.amount.toLocaleString('es-PY')}</span>
                  <button onClick={() => handleEdit(exp)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Editar</button>
                  <button onClick={() => handleDelete(exp.id)} className="text-sm text-red-500 dark:text-red-400 hover:underline">Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
