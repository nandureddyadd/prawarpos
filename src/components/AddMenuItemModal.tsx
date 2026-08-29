import React, { useState } from 'react';
import { usePos } from '../context/PosContext';
import { MenuCategory, MenuItem } from '../types';
import { X, Plus, UtensilsCrossed } from 'lucide-react';
import { sounds } from '../utils/audio';

interface AddMenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategoryId?: string;
}

export const AddMenuItemModal: React.FC<AddMenuItemModalProps> = ({
  isOpen,
  onClose,
  initialCategoryId,
}) => {
  const { categories, addCategory, addMenuItem } = usePos();

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(
    initialCategoryId && initialCategoryId !== 'all' ? initialCategoryId : categories[0]?.id || ''
  );
  const [newCatName, setNewCatName] = useState('');
  const [showNewCatInput, setShowNewCatInput] = useState(categories.length === 0);
  const [price, setPrice] = useState<number | ''>('');
  const [isVeg, setIsVeg] = useState(true);
  const [shortCode, setShortCode] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || price === '' || Number(price) <= 0) {
      sounds.playAlert();
      return;
    }

    let targetCatId = categoryId;

    if (showNewCatInput && newCatName.trim()) {
      const created = addCategory(newCatName.trim());
      targetCatId = created.id;
    }

    if (!targetCatId) {
      // Create a default category if none exists
      const created = addCategory('Main Course');
      targetCatId = created.id;
    }

    addMenuItem({
      name: name.trim(),
      categoryId: targetCatId,
      price: Number(price),
      isVeg,
      isAvailable: true,
      shortCode: shortCode.trim() || undefined,
      description: description.trim() || undefined,
      image: imageUrl.trim() || undefined,
    });

    sounds.playPaymentSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs select-none">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-[#e5e7eb] text-[#1a1a1a]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e5e7eb] bg-[#f8f9fa] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#fff1eb] text-[#FF6321]">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#1a1a1a]">Add New Menu Dish</h3>
              <p className="text-xs text-[#6b7280]">Add a dish to your restaurant menu</p>
            </div>
          </div>

          <button
            id="close-add-dish-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-[#1a1a1a] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          
          {/* Dish Name */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-[#6b7280] mb-1">
              Dish / Item Name *
            </label>
            <input
              type="text"
              id="input-dish-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Butter Paneer Masala, Cold Coffee, Margherita Pizza"
              className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#e5e7eb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:bg-white focus:outline-hidden focus:border-[#FF6321]"
              required
            />
          </div>

          {/* Category */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold uppercase text-[#6b7280]">
                Category *
              </label>
              <button
                type="button"
                onClick={() => setShowNewCatInput(!showNewCatInput)}
                className="text-[11px] font-bold text-[#FF6321] hover:underline cursor-pointer"
              >
                {showNewCatInput ? 'Select Existing' : '+ New Category'}
              </button>
            </div>

            {showNewCatInput ? (
              <input
                type="text"
                id="input-new-cat-name"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder="e.g. Starters, Beverages, Desserts"
                className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#e5e7eb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:bg-white focus:outline-hidden focus:border-[#FF6321]"
                required={categories.length === 0}
              />
            ) : (
              <select
                id="select-dish-category"
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#e5e7eb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:bg-white focus:outline-hidden focus:border-[#FF6321]"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Price & Food Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#6b7280] mb-1">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                id="input-dish-price"
                value={price}
                onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 240"
                min="1"
                step="any"
                className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#e5e7eb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:bg-white focus:outline-hidden focus:border-[#FF6321]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-[#6b7280] mb-1">
                Food Preference
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  id="dish-veg-btn"
                  onClick={() => setIsVeg(true)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    isVeg
                      ? 'bg-green-50 border-green-500 text-green-700 font-extrabold'
                      : 'bg-[#f8f9fa] border-[#e5e7eb] text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span>Veg</span>
                </button>
                <button
                  type="button"
                  id="dish-nonveg-btn"
                  onClick={() => setIsVeg(false)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    !isVeg
                      ? 'bg-red-50 border-red-500 text-red-700 font-extrabold'
                      : 'bg-[#f8f9fa] border-[#e5e7eb] text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span>Non-Veg</span>
                </button>
              </div>
            </div>
          </div>

          {/* Short Code & Image URL (optional) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#6b7280] mb-1">
                Short Code (Optional)
              </label>
              <input
                type="text"
                id="input-dish-code"
                value={shortCode}
                onChange={e => setShortCode(e.target.value)}
                placeholder="e.g. BPM, CC01"
                className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#e5e7eb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:bg-white focus:outline-hidden focus:border-[#FF6321]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-[#6b7280] mb-1">
                Image URL (Optional)
              </label>
              <input
                type="url"
                id="input-dish-image"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#e5e7eb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:bg-white focus:outline-hidden focus:border-[#FF6321]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-[#6b7280] mb-1">
              Description / Notes (Optional)
            </label>
            <input
              type="text"
              id="input-dish-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Fresh cottage cheese in rich tomato cashew gravy"
              className="w-full px-3.5 py-2.5 bg-[#f8f9fa] border border-[#e5e7eb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:bg-white focus:outline-hidden focus:border-[#FF6321]"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e5e7eb]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#6b7280] hover:bg-gray-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-dish-btn"
              className="flex items-center gap-1.5 px-6 py-2.5 bg-[#1a1a1a] hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#FF6321]" />
              <span>Save Menu Item</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
