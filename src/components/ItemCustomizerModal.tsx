import React, { useState, useEffect } from 'react';
import { MenuItem, MenuItemVariant, MenuItemAddon, CartItem } from '../types';
import { formatCurrency } from '../utils/formatters';
import { X, Plus, Minus, Check, Flame, MessageSquare, UtensilsCrossed } from 'lucide-react';
import { sounds } from '../utils/audio';

interface ItemCustomizerModalProps {
  item: MenuItem;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (cartItem: CartItem) => void;
  initialCartItem?: CartItem | null;
  onUpdateCartItem?: (cartItem: CartItem) => void;
}

export const ItemCustomizerModal: React.FC<ItemCustomizerModalProps> = ({
  item,
  isOpen,
  onClose,
  onAddToCart,
  initialCartItem,
  onUpdateCartItem,
}) => {
  const isEditMode = !!initialCartItem;
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<MenuItemVariant | undefined>(undefined);
  const [selectedAddons, setSelectedAddons] = useState<MenuItemAddon[]>([]);
  const [spiceLevel, setSpiceLevel] = useState<'Mild' | 'Medium' | 'Spicy' | 'Extra Spicy'>('Medium');
  const [instructions, setInstructions] = useState('');

  // Reset or populate state whenever modal opens or item/initialCartItem changes
  useEffect(() => {
    if (!isOpen) return;

    if (initialCartItem) {
      setQuantity(initialCartItem.quantity || 1);
      setSelectedVariant(initialCartItem.variant);
      setSelectedAddons(initialCartItem.addons || []);
      setSpiceLevel(initialCartItem.spiceLevel || 'Medium');
      setInstructions(initialCartItem.instructions || '');
    } else if (item) {
      setQuantity(1);
      setSelectedVariant(item.variants && item.variants.length > 0 ? item.variants[0] : undefined);
      setSelectedAddons([]);
      setSpiceLevel('Medium');
      setInstructions('');
    }
  }, [isOpen, item?.id, initialCartItem?.id]);

  if (!isOpen || !item) return null;

  const basePrice = selectedVariant ? selectedVariant.price : item.price;
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const unitPrice = basePrice + addonsTotal;
  const totalPrice = unitPrice * quantity;

  const toggleAddon = (addon: MenuItemAddon) => {
    setSelectedAddons(prev => {
      const exists = prev.some(a => a.id === addon.id);
      if (exists) {
        return prev.filter(a => a.id !== addon.id);
      } else {
        return [...prev, addon];
      }
    });
    sounds.playTap();
  };

  const handleAddOrUpdate = () => {
    const cartLine: CartItem = {
      id: initialCartItem ? initialCartItem.id : `ci-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      menuItemId: item.id,
      name: item.name,
      price: unitPrice,
      quantity,
      variant: selectedVariant,
      addons: selectedAddons.length > 0 ? selectedAddons : undefined,
      spiceLevel,
      instructions: instructions.trim() || undefined,
      isVeg: item.isVeg,
      isSentToKot: initialCartItem ? initialCartItem.isSentToKot : false,
      kotId: initialCartItem ? initialCartItem.kotId : undefined,
    };

    if (isEditMode && onUpdateCartItem) {
      onUpdateCartItem(cartLine);
    } else {
      onAddToCart(cartLine);
    }
    sounds.playTap();
    onClose();
  };

  const quickNotes = ['Less spicy', 'Extra spicy', 'No onion/garlic', 'Well cooked', 'Crispy', 'Served hot'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs select-none">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-[#e5e7eb] text-[#1a1a1a]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e5e7eb] bg-[#f8f9fa] px-5 py-4">
          <div className="flex items-center gap-3">
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-2xl object-cover border border-[#e5e7eb]"
              />
            ) : (
              <div className="w-11 h-11 rounded-2xl bg-[#fff1eb] border border-orange-200 flex items-center justify-center text-[#FF6321]">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                <h3 className="font-extrabold text-[#1a1a1a] text-base">
                  {isEditMode ? `Edit Item: ${item.name}` : item.name}
                </h3>
                {isEditMode && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-orange-100 text-[#FF6321] rounded-md border border-orange-200">
                    Editing Cart Item
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6b7280] font-semibold">{formatCurrency(unitPrice)} per item</p>
            </div>
          </div>
          <button
            id="close-customizer-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-[#1a1a1a] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customization Options */}
        <div className="max-h-[60vh] overflow-y-auto p-5 space-y-4 text-xs">
          
          {/* Quantity Selector */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#f8f9fa] border border-[#e5e7eb]">
            <span className="font-bold text-[#1a1a1a] uppercase tracking-wider text-[11px]">Quantity</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                id="customizer-qty-minus-btn"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-xl bg-white border border-[#e5e7eb] text-[#1a1a1a] hover:bg-gray-100 flex items-center justify-center font-bold cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-base font-black text-[#1a1a1a] w-6 text-center">{quantity}</span>
              <button
                type="button"
                id="customizer-qty-plus-btn"
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-xl bg-[#1a1a1a] text-white hover:bg-black flex items-center justify-center font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#FF6321]" />
              </button>
            </div>
          </div>

          {/* Portion / Variants */}
          {item.variants && item.variants.length > 0 && (
            <div>
              <label className="block font-bold text-[#1a1a1a] uppercase tracking-wider text-[11px] mb-2">
                {item.categoryId === 'cat-pasta' ? 'Dietary Choice (Veg / Non-Veg)' : item.categoryId === 'cat-ice-cream' ? 'Select Scoop Portion' : 'Choose Size / Portion'}
              </label>
              
              {/* If Half & Half Pizza, show Regular as unavailable with "—" */}
              {item.id.startsWith('pza-half-') && (
                <div className="mb-2 p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-800 flex items-center justify-between">
                  <span>Regular Size:</span>
                  <span className="font-mono font-black text-gray-500">— (Not Available for Half & Half)</span>
                </div>
              )}

              <div className={`grid gap-2 ${item.variants.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {item.variants.map(v => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-1 transition cursor-pointer ${
                      selectedVariant?.id === v.id
                        ? 'border-[#FF6321] bg-[#fff1eb] text-[#1a1a1a] font-bold shadow-2xs'
                        : 'border-[#e5e7eb] bg-white text-[#1a1a1a] hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs">{v.name}</span>
                      {selectedVariant?.id === v.id && (
                        <span className="w-2 h-2 rounded-full bg-[#FF6321]" />
                      )}
                    </div>
                    <span className="font-black text-sm text-[#FF6321]">{formatCurrency(v.price)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add-ons & Toppings */}
          {((item.addons && item.addons.length > 0) || item.categoryId === 'cat-pizza' || item.categoryId === 'cat-sandwiches' || item.categoryId === 'cat-pasta' || item.categoryId === 'cat-quesadilla' || item.categoryId === 'cat-garlic-bread' || item.categoryId === 'cat-wraps') && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-bold text-[#1a1a1a] uppercase tracking-wider text-[11px]">
                  Add-ons & Extra Toppings
                </label>
                <span className="text-[10px] text-[#6b7280] font-bold">+₹40 each</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(item.addons && item.addons.length > 0 ? item.addons : [
                  { id: 'addon-cheese', name: 'Extra Cheese Topping', price: 40 },
                  { id: 'addon-chicken', name: 'Extra Chicken Topping', price: 40 },
                  { id: 'addon-veg', name: 'Saute Vegetable Topping', price: 40 },
                  { id: 'addon-egg', name: 'Double Egg Topping', price: 40 },
                ]).map(addon => {
                  const isChecked = selectedAddons.some(a => a.id === addon.id);
                  return (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => toggleAddon(addon)}
                      className={`p-2.5 rounded-2xl border flex items-center justify-between text-left transition cursor-pointer ${
                        isChecked
                          ? 'border-[#FF6321] bg-[#fff1eb] text-[#1a1a1a] font-bold'
                          : 'border-[#e5e7eb] bg-white text-[#1a1a1a] hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                          isChecked ? 'bg-[#FF6321] border-[#FF6321] text-white' : 'border-[#e5e7eb]'
                        }`}>
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <span className="text-xs font-semibold">{addon.name}</span>
                      </div>
                      <span className="font-extrabold text-xs text-[#FF6321]">+{formatCurrency(addon.price)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Spice Level */}
          <div>
            <label className="block font-bold text-[#1a1a1a] uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-[#FF6321]" />
              <span>Spice Level Preference</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['Mild', 'Medium', 'Spicy', 'Extra Spicy'] as const).map(lvl => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSpiceLevel(lvl)}
                  className={`py-2 px-1 rounded-xl text-center font-bold text-[11px] border transition cursor-pointer ${
                    spiceLevel === lvl
                      ? 'bg-[#fff1eb] border-[#FF6321] text-[#FF6321]'
                      : 'bg-white border-[#e5e7eb] text-[#1a1a1a] hover:bg-gray-50'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Special Kitchen Cooking Note */}
          <div>
            <label className="block font-bold text-[#1a1a1a] uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-[#6b7280]" />
              <span>Chef Kitchen Instructions (Printed on KOT)</span>
            </label>
            
            <input
              type="text"
              id="item-kitchen-note-input"
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="e.g. Less oil, extra crispy, no onions..."
              className="w-full rounded-xl border border-[#e5e7eb] bg-[#f8f9fa] px-3 py-2 text-xs font-semibold text-[#1a1a1a] placeholder-gray-400 focus:outline-hidden focus:border-[#FF6321] focus:bg-white"
            />

            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickNotes.map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setInstructions(prev => prev ? `${prev}, ${n}` : n)}
                  className="rounded-lg bg-[#f8f9fa] border border-[#e5e7eb] px-2 py-1 text-[10px] font-semibold text-[#1a1a1a] hover:bg-gray-100 cursor-pointer"
                >
                  + {n}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Add Action */}
        <div className="flex items-center justify-between border-t border-[#e5e7eb] bg-[#f8f9fa] p-4">
          <div>
            <span className="text-[11px] font-bold text-[#6b7280] block uppercase">Total Line Item</span>
            <span className="text-lg font-black text-[#1a1a1a]">{formatCurrency(totalPrice)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="cancel-customizer-btn"
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-bold text-[#6b7280] hover:bg-gray-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="confirm-customizer-add-btn"
              type="button"
              onClick={handleAddOrUpdate}
              className="rounded-xl bg-[#1a1a1a] hover:bg-black px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-xs active:scale-95 transition cursor-pointer"
            >
              {isEditMode ? `Update Item (${quantity})` : `Add to Order (${quantity})`}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
