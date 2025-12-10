import React from 'react'; // Bỏ "useContext" vì chúng ta không dùng trực tiếp nữa
import styles from './ProductCard.module.scss';
import { Link } from 'react-router-dom';
import { useWishlist } from '../../../contexts/WishlistContext'; 

// Hàm định dạng tiền tệ
const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const ProductCard = ({ product }) => {
  // THAY ĐỔI 2: Sử dụng "useWishlist()"
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  if (!product) {
    return null;
  }

  const isFavorited = isInWishlist(product.id);

  // Xử lý click nút yêu thích
  const handleWishlistClick = (e) => {
    e.preventDefault(); // Ngăn thẻ <Link> bên ngoài điều hướng
    e.stopPropagation(); // Ngăn sự kiện nổi bọt
    
    if (isFavorited) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product); // Giả sử addToWishlist nhận full object product
    }
  };

  return (
    <Link to={`/product/${product.id}`} className={styles.cardLink}>
      <div className={styles.card}>
        
        <div className={styles.imageContainer}>
          
          {/* NÚT TRÁI TIM */}
          <button 
            className={styles.wishlistButton} 
            onClick={handleWishlistClick}
            aria-label={isFavorited ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
          >
            {isFavorited ? (
              // Trái tim đã điền (Filled)
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className={`${styles.heartIcon} ${styles.heartIconFilled}`}
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            ) : (
              // Trái tim rỗng (Empty)
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className={styles.heartIcon}
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            )}
          </button>

          <img 
            src={product.images && product.images.length > 0 ? product.images[0] : ''} 
            alt={product.name} 
            className={styles.image} 
          />
          
          {/* LỚP PHỦ XEM CHI TIẾT */}
          <div className={styles.overlay}>
            <div className={styles.overlayContent}>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className={styles.eyeIcon}
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <span>Xem chi tiết</span>
            </div>
          </div>
        </div>
        
        <h4 className={styles.name}>
          {product.name}
        </h4>

        <p className={styles.price}>{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
};

export default ProductCard;