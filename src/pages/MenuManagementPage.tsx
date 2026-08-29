import React, { useState, useMemo } from 'react';
import { usePos } from '../context/PosContext';
import { MenuItem, Category, MenuItemVariant } from '../types';
import { formatCurrency } from '../utils/formatters';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  Flame,
  CheckCircle2,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { sounds } from '../utils/audio';

export const MenuManagementPage: React.FC = () => {
  const { categories, menuItems, toggleItemAvailability, addMenuItem, updateMenuItem, deleteMenuItem } = usePos();

  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'non-veg' | 'available' | 'unavailable'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState<boolean>(false);

  // Form State for Add / Edit
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: '',
    categoryId: categories[0]?.id || 'cat-pizza',
    price: 250,
    isVeg: true,
    isAvailable: true,
    shortCode: '',
    description: '',
  });

  const [variantsList, setVariantsList] = useState<MenuItemVariant[]>([]);

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      if (selectedCatId !== 'all' && item.categoryId !== selectedCatId) {
        return false;
      }
      if (dietaryFilter === 'veg' && !item.isVeg) {
        return false;
      }
      if (dietaryFilter === 'non-veg' && item.isVeg) {
        return false;
      }
      if (dietaryFilter === 'available' && !item.isAvailable) {
        return false;
      }
      if (dietaryFilter === 'unavailable' && item.isAvailable) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchCode = item.shortCode?.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchDesc) return false;
      }
      return true;
    });
  }, [menuItems, selectedCatId, dietaryFilter, searchQuery]);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      categoryId: selectedCatId !== 'all' ? selectedCatId : categories[0]?.id || 'cat-pizza',
      price: 250,
      isVeg: true,
      isAvailable: true,
      shortCode: '',
      description: '',
    });
    setVariantsList([]);
    setEditingItem(null);
    setIsNewItemModalOpen(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setVariantsList(item.variants ? [...item.variants] : []);
    setIsNewItemModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.categoryId) return;

    const finalVariants = variantsList.filter(v => v.name.trim() && v.price > 0);

    if (editingItem) {
      updateMenuItem({
        ...editingItem,
        ...formData,
        price: Number(formData.price),
        variants: finalVariants.length > 0 ? finalVariants : undefined,
      } as MenuItem);
    } else {
      const newItem: MenuItem = {
        id: `mi-${Date.now()}`,
        name: formData.name,
        categoryId: formData.categoryId,
        price: Number(formData.price),
        isVeg: !!formData.isVeg,
        isAvailable: formData.isAvailable ?? true,
        shortCode: formData.shortCode,
        description: formData.description,
        variants: finalVariants.length > 0 ? finalVariants : undefined,
      };
      addMenuItem(newItem);
    }

    sounds.playPaymentSuccess();
    setIsNewItemModalOpen(false);
  };

  const addVariantRow = () => {
    setVariantsList([
      ...variantsList,
      { id: `var-${Date.now()}-${variantsList.length}`, name: '', price: Number(formData.price) || 100 },
    ]);
  };

  const updateVariantRow = (index: number, field: 'name' | 'price', value: any) => {
    const updated = [...variantsList];
    updated[index] = { ...updated[index], [field]: value };
    setVariantsList(updated);
  };

  const removeVariantRow = (index: number) => {
    setVariantsList(variantsList.filter((_, i) => i !== index));
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-[#f8f9fa] select-none text-[#1a1a1a]">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#e5e7eb] shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#fff1eb] text-[#FF6321]">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#1a1a1a] uppercase tracking-tight">
              Restaurant Menu Catalog & Live 86 Controls
            </h2>
            <p className="text-xs text-[#6b7280] font-medium">
              Manage 18 official menu categories, portion variants, prices, and instant kitchen availability.
            </p>
          </div>
        </div>

        <button
          id="add-menu-dish-btn"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1a1a1a] hover:bg-black text-white rounded-2xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#FF6321]" />
          <span>Add New Dish</span>
        </button>
      </div>

      {/* Categories Bar & Search */}
      <div className="bg-white p-4 rounded-3xl border border-[#e5e7eb] space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search dishes by name, short code, or description..."
              className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold text-[#1a1a1a] bg-[#f8f9fa] border border-[#e5e7eb] rounded-2xl focus:bg-white focus:border-[#FF6321] focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-[#6b7280] font-bold">
            <span>Showing {filteredItems.length} dishes</span>
          </div>
        </div>

        {/* Dietary & Stock Filters */}
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 no-scrollbar text-xs">
          <button
            type="button"
            onClick={() => setDietaryFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer ${
              dietaryFilter === 'all' ? 'bg-[#1a1a1a] text-white shadow-xs' : 'bg-[#f8f9fa] border border-[#e5e7eb] text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Items
          </button>

          <button
            type="button"
            onClick={() => setDietaryFilter(dietaryFilter === 'veg' ? 'all' : 'veg')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer ${
              dietaryFilter === 'veg' ? 'bg-green-600 text-white shadow-xs' : 'bg-[#f8f9fa] border border-[#e5e7eb] text-green-700 hover:bg-green-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-green-500 ring-2 ring-white" />
            <span>Veg</span>
          </button>

          <button
            type="button"
            onClick={() => setDietaryFilter(dietaryFilter === 'non-veg' ? 'all' : 'non-veg')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer ${
              dietaryFilter === 'non-veg' ? 'bg-red-600 text-white shadow-xs' : 'bg-[#f8f9fa] border border-[#e5e7eb] text-red-700 hover:bg-red-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
            <span>Non-Veg</span>
          </button>

          <button
            type="button"
            onClick={() => setDietaryFilter(dietaryFilter === 'available' ? 'all' : 'available')}
            className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer ${
              dietaryFilter === 'available' ? 'bg-blue-600 text-white shadow-xs' : 'bg-[#f8f9fa] border border-[#e5e7eb] text-gray-600 hover:bg-gray-100'
            }`}
          >
            In Stock
          </button>

          <button
            type="button"
            onClick={() => setDietaryFilter(dietaryFilter === 'unavailable' ? 'all' : 'unavailable')}
            className={`px-3 py-1.5 rounded-xl font-extrabold transition cursor-pointer ${
              dietaryFilter === 'unavailable' ? 'bg-gray-800 text-white shadow-xs' : 'bg-[#f8f9fa] border border-[#e5e7eb] text-gray-500 hover:bg-gray-100'
            }`}
          >
            Out of Stock (86)
          </button>
        </div>

        {/* 18 Categories Horizontal Pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setSelectedCatId('all')}
            className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition ${
              selectedCatId === 'all'
                ? 'bg-[#1a1a1a] text-white shadow-xs'
                : 'bg-[#f8f9fa] border border-[#e5e7eb] text-[#1a1a1a] hover:bg-gray-100'
            }`}
          >
            All Categories ({menuItems.length})
          </button>

          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCatId(cat.id)}
              className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition ${
                selectedCatId === cat.id
                  ? 'bg-[#1a1a1a] text-white shadow-xs'
                  : 'bg-[#f8f9fa] border border-[#e5e7eb] text-[#1a1a1a] hover:bg-gray-100'
              }`}
            >
              {cat.name} ({menuItems.filter(m => m.categoryId === cat.id).length})
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#e5e7eb] text-gray-500 font-semibold text-xs">
          No menu dishes match the selected category, search, or stock filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map(item => {
            const category = categories.find(c => c.id === item.categoryId);

            return (
              <div
                key={item.id}
                className={`p-4 rounded-3xl border bg-white shadow-2xs flex flex-col justify-between transition ${
                  !item.isAvailable ? 'border-red-200 bg-red-50/10' : 'border-[#e5e7eb] hover:border-[#FF6321]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="font-extrabold text-sm text-[#1a1a1a]">{item.name}</span>
                    </div>
                    {item.shortCode && (
                      <span className="text-[10px] bg-[#f8f9fa] border border-[#e5e7eb] text-[#6b7280] px-1.5 py-0.5 rounded-md font-mono font-bold">
                        #{item.shortCode}
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] font-bold text-[#6b7280] mb-1.5">{category?.name}</div>

                  {item.description && (
                    <p className="text-xs text-[#6b7280] line-clamp-2 mb-2 leading-relaxed font-medium">
                      {item.description}
                    </p>
                  )}

                  {item.variants && item.variants.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mb-2">
                      {item.variants.map(v => (
                        <span key={v.id} className="text-[10px] bg-[#fff1eb] text-[#FF6321] px-2 py-0.5 rounded-lg font-bold border border-orange-100">
                          {v.name}: {formatCurrency(v.price)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Price & Controls */}
                <div className="pt-3 border-t border-[#e5e7eb] flex items-center justify-between">
                  <span className="text-sm font-black text-[#1a1a1a]">
                    {formatCurrency(item.price)}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Instant 86 / In-Stock toggle */}
                    <button
                      onClick={() => {
                        toggleItemAvailability(item.id);
                        sounds.playTap();
                      }}
                      title="Toggle In-Stock / Out-of-Stock (86)"
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border transition cursor-pointer ${
                        item.isAvailable
                          ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                          : 'bg-red-100 text-red-800 border-red-300'
                      }`}
                    >
                      {item.isAvailable ? 'In Stock' : '86 (Out)'}
                    </button>

                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-xl bg-gray-50 border border-[#e5e7eb] text-[#1a1a1a] hover:bg-gray-100 cursor-pointer"
                      title="Edit Item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Delete dish "${item.name}"?`)) {
                          deleteMenuItem(item.id);
                        }
                      }}
                      className="p-1.5 rounded-xl bg-gray-50 border border-[#e5e7eb] text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Dish Modal */}
      {isNewItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs select-none">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-[#e5e7eb]">
            <div className="flex items-center justify-between border-b border-[#e5e7eb] bg-gray-50 px-5 py-4">
              <h3 className="font-extrabold text-[#1a1a1a] text-base">
                {editingItem ? 'Edit Menu Dish' : 'Add New Menu Item'}
              </h3>
              <button onClick={() => setIsNewItemModalOpen(false)} className="text-gray-400 hover:text-gray-700 font-bold p-1 rounded-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#1a1a1a] mb-1 uppercase text-[10px]">Dish Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Tandoori Paneer Pizza"
                  className="w-full p-2.5 rounded-2xl border border-[#e5e7eb] bg-[#f8f9fa] font-semibold text-[#1a1a1a] focus:bg-white focus:border-[#FF6321] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1a1a1a] mb-1 uppercase text-[10px]">Category *</label>
                  <select
                    value={formData.categoryId || categories[0]?.id}
                    onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full p-2.5 rounded-2xl border border-[#e5e7eb] font-semibold bg-white text-[#1a1a1a] focus:border-[#FF6321] focus:outline-hidden"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#1a1a1a] mb-1 uppercase text-[10px]">Base Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.price || ''}
                    onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-2xl border border-[#e5e7eb] bg-[#f8f9fa] font-bold text-[#1a1a1a] focus:bg-white focus:border-[#FF6321] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1a1a1a] mb-1 uppercase text-[10px]">Diet Type</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isVeg: true })}
                      className={`flex-1 py-2 rounded-2xl font-bold border transition cursor-pointer ${
                        formData.isVeg ? 'bg-green-600 text-white border-green-600' : 'bg-gray-50 text-[#1a1a1a] border-[#e5e7eb]'
                      }`}
                    >
                      Veg 🥬
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isVeg: false })}
                      className={`flex-1 py-2 rounded-2xl font-bold border transition cursor-pointer ${
                        !formData.isVeg ? 'bg-red-600 text-white border-red-600' : 'bg-gray-50 text-[#1a1a1a] border-[#e5e7eb]'
                      }`}
                    >
                      Non-Veg 🍗
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#1a1a1a] mb-1 uppercase text-[10px]">Short Code</label>
                  <input
                    type="text"
                    value={formData.shortCode || ''}
                    onChange={e => setFormData({ ...formData, shortCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. PZA-01"
                    className="w-full p-2.5 rounded-2xl border border-[#e5e7eb] bg-[#f8f9fa] font-mono font-bold text-[#1a1a1a] focus:bg-white focus:border-[#FF6321] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Portion Sizes / Variants Section */}
              <div className="p-3 bg-[#f8f9fa] rounded-2xl border border-[#e5e7eb] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#1a1a1a] uppercase text-[10px] flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#FF6321]" />
                    <span>Portion Sizes / Variants (e.g. Regular, Large, XL or Veg, Non-Veg)</span>
                  </label>
                  <button
                    type="button"
                    onClick={addVariantRow}
                    className="text-[10px] font-black uppercase text-[#FF6321] hover:underline"
                  >
                    + Add Size Variant
                  </button>
                </div>

                {variantsList.length === 0 ? (
                  <p className="text-[11px] text-[#6b7280]">No size variants set. The base price will apply for single portion.</p>
                ) : (
                  <div className="space-y-2">
                    {variantsList.map((v, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Size (e.g. Regular, Large, XL, Veg, Non-Veg)"
                          value={v.name}
                          onChange={e => updateVariantRow(idx, 'name', e.target.value)}
                          className="flex-1 p-2 rounded-xl border border-[#e5e7eb] bg-white font-semibold"
                        />
                        <input
                          type="number"
                          placeholder="Price (₹)"
                          value={v.price}
                          onChange={e => updateVariantRow(idx, 'price', parseFloat(e.target.value) || 0)}
                          className="w-24 p-2 rounded-xl border border-[#e5e7eb] bg-white font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => removeVariantRow(idx)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-[#1a1a1a] mb-1 uppercase text-[10px]">Description & Ingredients</label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Classic mozzarella, fresh basil, and house pomodoro tomato sauce."
                  className="w-full p-2.5 rounded-2xl border border-[#e5e7eb] bg-[#f8f9fa] font-medium text-[#1a1a1a] focus:bg-white focus:border-[#FF6321] focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e5e7eb]">
                <button
                  type="button"
                  onClick={() => setIsNewItemModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 rounded-2xl font-bold text-[#6b7280] cursor-pointer hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1a1a1a] text-white rounded-2xl font-black uppercase tracking-wider cursor-pointer hover:bg-black"
                >
                  {editingItem ? 'Save Changes' : 'Create Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
