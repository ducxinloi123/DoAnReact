import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  
  // 1. Tạo dynamic key: Nếu có user thì dùng "wishlist_userId", nếu không thì dùng "wishlist_guest"
  const wishlistKey = user ? `wishlist_${user.id}` : 'wishlist_guest';

  const [wishlist, setWishlist] = useState([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  // 2. Load wishlist khi key thay đổi (Login/Logout/Mount)
  useEffect(() => {
    try {
      const localData = localStorage.getItem(wishlistKey);
      const parsedData = localData ? JSON.parse(localData) : [];
      setWishlist(parsedData);
    } catch (error) {
      console.error("Error loading wishlist:", error);
      setWishlist([]);
    }
  }, [wishlistKey]); // Chạy lại khi user thay đổi

  // 3. Lưu wishlist vào localStorage mỗi khi danh sách thay đổi
  useEffect(() => {
    localStorage.setItem(wishlistKey, JSON.stringify(wishlist));
  }, [wishlist, wishlistKey]);


  const addToWishlist = (product) => {
    // Kiểm tra xem đã có trong wishlist chưa để tránh trùng lặp
    if (!wishlist.includes(product.id)) {
      setWishlist(prev => [...prev, product.id]);
      console.log(`Added ${product.name} to wishlist.`);
    } else {
        console.log(`${product.name} is already in wishlist.`);
    }
  };

  const removeFromWishlist = (productId) => {
    setWishlist(prev => prev.filter(id => id !== productId));
    console.log(`Removed ${productId} from wishlist.`);
  };
  
  const isInWishlist = (productId) => {
    return wishlist.includes(productId);
  };

  const openWishlist = () => setIsWishlistOpen(true);
  const closeWishlist = () => setIsWishlistOpen(false);

  return (
    <WishlistContext.Provider 
      value={{ 
        wishlist, 
        addToWishlist, 
        removeFromWishlist, 
        isInWishlist,
        isWishlistOpen, 
        openWishlist,   
        closeWishlist   
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  return useContext(WishlistContext);
};