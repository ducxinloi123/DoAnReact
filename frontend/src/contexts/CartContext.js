import React, { createContext, useState, useEffect, useContext } from 'react';
// 1. Import useAuth để lấy thông tin user hiện tại
import { useAuth } from './AuthContext'; 

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth(); // Lấy user từ AuthContext
  
  // 2. Tạo dynamic key dựa trên user.id
  // Nếu có user thì dùng "cart_userId", nếu không thì dùng "cart_guest"
  const cartKey = user ? `cart_${user.id}` : 'cart_guest';

  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  // 3. Load giỏ hàng khi cartKey thay đổi (tức là khi User login/logout)
  useEffect(() => {
    try {
      const localData = localStorage.getItem(cartKey);
      const parsedData = localData ? JSON.parse(localData) : [];
      setCartItems(parsedData);
      
      // Tự động chọn tất cả khi load giỏ hàng mới
      setSelectedItems(parsedData.map(item => `${item.id}-${item.color}-${item.size}`));
    } catch (error) {
      setCartItems([]);
    }
  }, [cartKey]); // Chạy lại mỗi khi user đổi

  // 4. Lưu giỏ hàng mỗi khi cartItems thay đổi
  useEffect(() => {
    localStorage.setItem(cartKey, JSON.stringify(cartItems));

    // Logic cập nhật selectedItems (giữ nguyên logic cũ của bạn)
    setSelectedItems(prevSelected => {
      const currentItemIds = cartItems.map(item => `${item.id}-${item.color}-${item.size}`);
      return prevSelected.filter(id => currentItemIds.includes(id));
    });
  }, [cartItems, cartKey]); // Thêm cartKey vào dependency

  // --- HÀM MỚI ĐỂ XÓA CÁC SẢN PHẨM ĐÃ CHỌN (Giữ nguyên) ---
  const clearCartItems = (itemsToClear) => {
    setCartItems(prevItems => 
      prevItems.filter(item => {
        const itemIdentifier = `${item.id}-${item.color}-${item.size}`;
        return !itemsToClear.includes(itemIdentifier);
      })
    );
    setSelectedItems(prevSelected => 
      prevSelected.filter(id => !itemsToClear.includes(id))
    );
  };

  // ... (Các hàm openCart, closeCart, toggleSelectItem... GIỮ NGUYÊN)
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const toggleSelectItem = (itemIdentifier) => {
    setSelectedItems(prevSelected => 
      prevSelected.includes(itemIdentifier)
        ? prevSelected.filter(id => id !== itemIdentifier)
        : [...prevSelected, itemIdentifier]
    );
  };

  const addToCart = (product, selectedColor, selectedSize, quantity) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => 
        item.id === product.id && 
        item.color === selectedColor.color && 
        item.size === selectedSize
      );

      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id && item.color === selectedColor.color && item.size === selectedSize
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        const newItemIdentifier = `${product.id}-${selectedColor.color}-${selectedSize}`;
        setSelectedItems(prevSelected => [...prevSelected, newItemIdentifier]);
        
        return [...prevItems, { 
          ...product, 
          color: selectedColor.color,
          size: selectedSize,
          quantity 
        }];
      }
    });
  };

  const removeFromCart = (productId, color, size) => {
    setCartItems(prevItems => prevItems.filter(item => 
      !(item.id === productId && item.color === color && item.size === size)
    ));
    const itemIdentifier = `${productId}-${color}-${size}`;
    setSelectedItems(prevSelected => prevSelected.filter(id => id !== itemIdentifier));
  };

  const updateQuantity = (productId, color, size, amount) => {
    setCartItems(prevItems => prevItems.map(item =>
      item.id === productId && item.color === color && item.size === size
        ? { ...item, quantity: Math.max(1, item.quantity + amount) }
        : item
    ));
  };

  return (
    <CartContext.Provider 
      value={{ 
        cartItems, 
        addToCart, 
        removeFromCart, 
        updateQuantity,
        isCartOpen,
        openCart,   
        closeCart,  
        selectedItems,
        toggleSelectItem,
        clearCartItems
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  return useContext(CartContext);
};