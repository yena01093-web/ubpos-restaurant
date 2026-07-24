'use client';
import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/adminFetch';
import type { Menu } from '@/types';

export default function MenusPanel() {
  const [menus, setMenus] = useState<Menu[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const data = await adminFetch('/api/admin/menus');
      setMenus(data.menus);
    } catch (err) {
      setError(err instanceof Error ? err.message : '불러오기에 실패했습니다.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const patchMenu = async (id: string, patch: Partial<Pick<Menu, 'name' | 'description' | 'price' | 'isActive'>>) => {
    try {
      await adminFetch(`/api/admin/menus/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
      setMenus(prev => prev?.map(m => (m.id === id ? { ...m, ...patch } : m)) ?? null);
    } catch (err) {
      alert(err instanceof Error ? err.message : '수정에 실패했습니다.');
    }
  };

  const deleteMenu = async (id: string) => {
    if (!confirm('이 메뉴를 삭제할까요? 기존 예약 기록에는 영향이 없습니다.')) return;
    try {
      await adminFetch(`/api/admin/menus/${id}`, { method: 'DELETE' });
      setMenus(prev => prev?.filter(m => m.id !== id) ?? null);
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!error && menus === null && <p className="text-sm text-stone-400">불러오는 중…</p>}

      {!error && menus && (
        <div className="space-y-3">
          {menus.map(menu => (
            <MenuRow key={menu.id} menu={menu} onPatch={patch => patchMenu(menu.id, patch)} onDelete={() => deleteMenu(menu.id)} />
          ))}
          {menus.length === 0 && <p className="text-sm text-stone-400">등록된 메뉴가 없습니다.</p>}
        </div>
      )}

      <NewMenuForm onCreated={load} />
    </div>
  );
}

function MenuRow({
  menu,
  onPatch,
  onDelete,
}: {
  menu: Menu;
  onPatch: (patch: Partial<Pick<Menu, 'name' | 'description' | 'price' | 'isActive'>>) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(menu.name);
  const [description, setDescription] = useState(menu.description);
  const [price, setPrice] = useState(menu.price !== null ? String(menu.price) : '');

  const saveText = () => {
    const trimmedName = name.trim();
    const trimmedDesc = description.trim();
    const parsedPrice = price.trim() === '' ? null : Number(price);
    if (trimmedName && trimmedName !== menu.name) onPatch({ name: trimmedName });
    if (trimmedDesc !== menu.description) onPatch({ description: trimmedDesc });
    if (parsedPrice !== menu.price && !Number.isNaN(parsedPrice)) onPatch({ price: parsedPrice });
  };

  return (
    <div className={['rounded-xl border p-4', menu.isActive ? 'border-stone-200 bg-white' : 'border-stone-200 bg-stone-50 opacity-60'].join(' ')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={saveText}
            maxLength={60}
            className="w-full rounded-md border border-stone-300 px-2 py-1 text-sm font-semibold text-stone-900"
          />
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            onBlur={saveText}
            rows={2}
            maxLength={500}
            className="w-full resize-none rounded-md border border-stone-300 px-2 py-1 text-xs text-stone-600"
          />
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={price}
              onChange={e => setPrice(e.target.value)}
              onBlur={saveText}
              placeholder="가격(선택)"
              className="w-32 rounded-md border border-stone-300 px-2 py-1 text-xs text-stone-600"
            />
            <span className="text-xs text-stone-400">원</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <label className="flex items-center gap-1.5 text-xs text-stone-500">
            <input type="checkbox" checked={menu.isActive} onChange={e => onPatch({ isActive: e.target.checked })} />
            노출
          </label>
          <button type="button" onClick={onDelete} className="text-xs text-red-500 underline">
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}

function NewMenuForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length === 0) return setError('메뉴 이름을 입력해주세요.');
    setSaving(true);
    setError(null);
    try {
      await adminFetch('/api/admin/menus', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          price: price.trim() === '' ? null : Number(price),
        }),
      });
      setName('');
      setDescription('');
      setPrice('');
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : '추가에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-dashed border-stone-300 p-4">
      <h3 className="text-sm font-semibold text-stone-900">새 메뉴 추가</h3>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        maxLength={60}
        placeholder="메뉴 이름"
        className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
      />
      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        maxLength={500}
        rows={2}
        placeholder="구성 설명"
        className="w-full resize-none rounded-md border border-stone-300 px-3 py-2 text-sm"
      />
      <input
        type="number"
        min={0}
        value={price}
        onChange={e => setPrice(e.target.value)}
        placeholder="가격(선택)"
        className="w-40 rounded-md border border-stone-300 px-3 py-2 text-sm"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-900 disabled:opacity-50"
      >
        {saving ? '추가 중…' : '메뉴 추가'}
      </button>
    </form>
  );
}
