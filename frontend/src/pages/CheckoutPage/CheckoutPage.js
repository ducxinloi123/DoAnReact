import React, { useState, useMemo, useEffect } from 'react';
import { useCart } from '../../contexts/CartContext';
import PageLayout from '../../components/layout/PageLayout/PageLayout';
import styles from './CheckoutPage.module.scss';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { promotions } from '../../data/mockData';
// --- 1. THÊM AXIOS ---
import axios from 'axios';

const CheckoutPage = () => {
  const { cartItems, selectedItems, clearCartItems } = useCart();
  const navigate = useNavigate();
  // --- 2. LẤY THÊM TOKEN TỪ AUTH ---
  const { user, token } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    note: '',
  });
  const [errors, setErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('cod');

  // State cho khuyến mãi
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null); 
  const [discountAmount, setDiscountAmount] = useState(0); 

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  // Lọc sản phẩm được chọn để thanh toán
  const itemsToCheckout = useMemo(() => 
    cartItems.filter(item => selectedItems.includes(`${item.id}-${item.color}-${item.size}`))
  , [cartItems, selectedItems]);

  // Tính Tạm tính
  const subtotal = useMemo(() => 
    itemsToCheckout.reduce((total, item) => total + (item.price * item.quantity), 0)
  , [itemsToCheckout]);
  
  // Tính phí vận chuyển
  const shippingFee = useMemo(() => {
    if (appliedPromo && appliedPromo.type === 'shipping') {
      return 0;
    }
    if (subtotal >= 2000000 || subtotal === 0) {
      return 0;
    }
    return 30000;
  }, [subtotal, appliedPromo]); 
  
  // Tính Tổng cộng
  const total = useMemo(() => {
    const calculatedTotal = subtotal + shippingFee - discountAmount;
    return Math.max(0, calculatedTotal);
  }, [subtotal, shippingFee, discountAmount]);

  // Logic kiểm tra lại mã KM
  useEffect(() => {
    if (appliedPromo && subtotal < appliedPromo.minOrderValue) {
      setAppliedPromo(null);
      setDiscountAmount(0);
      setPromoCodeInput('');
      toast.info('Mã khuyến mãi đã bị gỡ do không đủ điều kiện.');
    }
    else if (appliedPromo && appliedPromo.type === 'percent') {
      let discount = subtotal * (appliedPromo.value / 100);
      if (appliedPromo.maxValue && discount > appliedPromo.maxValue) {
        discount = appliedPromo.maxValue;
      }
      setDiscountAmount(Math.min(discount, subtotal));
    }
  }, [subtotal, appliedPromo]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Logic áp dụng mã KM
  const handleApplyPromoCode = () => {
    if (appliedPromo) return;
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) {
      toast.error('Vui lòng nhập mã khuyến mãi');
      return;
    }
    const promo = promotions.find(p => p.code.toUpperCase() === code);
    if (!promo) {
      toast.error('Mã khuyến mãi không hợp lệ hoặc đã hết hạn.');
      return;
    }
    if (subtotal < promo.minOrderValue) {
      toast.warn(`Đơn hàng phải từ ${formatPrice(promo.minOrderValue)} để áp dụng mã này.`);
      return;
    }
    if (promo.type === 'fixed') {
      const discount = Math.min(promo.value, subtotal);
      setDiscountAmount(discount);
      setAppliedPromo(promo);
      toast.success(`Áp dụng mã giảm ${formatPrice(discount)} thành công!`);
    } 
    else if (promo.type === 'percent') {
      let discount = subtotal * (promo.value / 100);
      if (promo.maxValue && discount > promo.maxValue) {
        discount = promo.maxValue;
      }
      setDiscountAmount(Math.min(discount, subtotal));
      setAppliedPromo(promo);
      toast.success(`Áp dụng mã giảm ${formatPrice(discount)} thành công!`);
    } 
    else if (promo.type === 'shipping') {
      setDiscountAmount(0); 
      setAppliedPromo(promo);
      toast.success('Áp dụng mã miễn phí vận chuyển thành công!');
    }
  };

  const handleRemovePromoCode = () => {
    setAppliedPromo(null);
    setDiscountAmount(0);
    setPromoCodeInput('');
    toast.info('Đã gỡ mã khuyến mãi.');
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.fullName) newErrors.fullName = 'Vui lòng nhập họ và tên';
    if (!formData.phone) newErrors.phone = 'Vui lòng nhập số điện thoại';
    if (!formData.address) newErrors.address = 'Vui lòng nhập địa chỉ';
    if (!formData.email) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- 3. HÀM GỬI ĐƠN HÀNG LÊN SERVER ---
  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại thông tin giao hàng!');
      return;
    }
    if (itemsToCheckout.length === 0) {
      toast.error('Không có sản phẩm nào để thanh toán!');
      navigate('/cart');
      return;
    }

    // Chuẩn bị dữ liệu gửi lên API
    const orderData = {
      orderItems: itemsToCheckout.map(item => ({
        name: item.name,
        qty: item.quantity,
        image: item.imageUrl || item.images[0], 
        price: item.price,
        product: item.id, // ID sản phẩm (quan trọng để liên kết DB)
        // Lưu thêm màu/size vào database nếu cần (bạn có thể cần sửa Model Backend để nhận thêm field này)
      })),
      shippingAddress: {
        address: formData.address,
        city: "Hồ Chí Minh", // Tạm thời để cứng hoặc thêm ô chọn City
        phone: formData.phone,
      },
      paymentMethod: paymentMethod === 'cod' ? 'COD' : 'VNPAY',
      totalPrice: total,
    };

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`, // Gửi kèm token
        },
      };

      // GỌI API TẠO ĐƠN
      const { data } = await axios.post('http://localhost:5000/api/orders', orderData, config);

      // Nếu thành công:
      toast.success('Đặt hàng thành công!');
      
      // Xóa các món đã mua khỏi giỏ
      clearCartItems(selectedItems);
      
      // Chuyển sang trang thành công với dữ liệu thật từ Server trả về
      navigate('/order-success', { 
        state: { 
          orderId: data._id, // ID thật từ MongoDB (VD: 6578a...)
          total: data.totalPrice,
          subtotal: subtotal,
          shippingFee: shippingFee,
          discount: discountAmount,
          appliedPromoCode: appliedPromo ? appliedPromo.code : null,
          items: itemsToCheckout,
          customer: formData
        }, 
        replace: true 
      });

    } catch (error) {
      console.error("Lỗi đặt hàng:", error);
      toast.error(error.response?.data?.message || "Đặt hàng thất bại. Vui lòng thử lại!");
    }
  };

  return (
    <PageLayout pageTitle="Thanh toán">
      <div className={styles.checkoutContainer}>
        <form onSubmit={handleSubmitOrder} className={styles.checkoutGrid} noValidate>
          {/* CỘT TRÁI: THÔNG TIN KHÁCH */}
          <div className={styles.customerInfo}>
            <h2>Thông tin giao hàng</h2>
            <div className={styles.inputGroup}>
              <input 
                type="text" 
                name="fullName"
                placeholder="Họ và tên" 
                className={`${styles.inputField} ${errors.fullName ? styles.inputError : ''}`}
                value={formData.fullName}
                onChange={handleChange}
              />
              {errors.fullName && <span className={styles.errorMessage}>{errors.fullName}</span>}
            </div>
            
            <div className={styles.inputGroup}>
              <input 
                type="email" 
                name="email"
                placeholder="Email" 
                className={`${styles.inputField} ${errors.email ? styles.inputError : ''}`}
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <span className={styles.errorMessage}>{errors.email}</span>}
            </div>

            <div className={styles.inputGroup}>
              <input 
                type="tel" 
                name="phone"
                placeholder="Số điện thoại" 
                className={`${styles.inputField} ${errors.phone ? styles.inputError : ''}`}
                value={formData.phone}
                onChange={handleChange}
              />
              {errors.phone && <span className={styles.errorMessage}>{errors.phone}</span>}
            </div>

            <div className={styles.inputGroup}>
              <input 
                type="text" 
                name="address"
                placeholder="Địa chỉ" 
                className={`${styles.inputField} ${errors.address ? styles.inputError : ''}`}
                value={formData.address}
                onChange={handleChange}
              />
              {errors.address && <span className={styles.errorMessage}>{errors.address}</span>}
            </div>
            
            <textarea 
              name="note"
              placeholder="Ghi chú (tùy chọn)" 
              className={styles.inputField}
              value={formData.note}
              onChange={handleChange}
            ></textarea>
            
            <h2 className={styles.paymentTitle}>Phương thức thanh toán</h2>
            <div className={styles.paymentOptions}>
              <label className={styles.paymentOption}>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="cod" 
                  checked={paymentMethod === 'cod'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <img src="/assets/images/logo.png" alt="COD" className={styles.paymentIcon} />
                Thanh toán khi nhận hàng (COD)
              </label>
              <label className={styles.paymentOption}>
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="vnpay" 
                  checked={paymentMethod === 'vnpay'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                 <img src="/assets/images/vnpay.png" alt="VNPAY" className={styles.paymentIcon} />
                Thanh toán qua VNPAY
              </label>
            </div>
          </div>

          {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG */}
          <div className={styles.orderSummary}>
            <h2>Đơn hàng của bạn ({itemsToCheckout.length} sản phẩm)</h2>
            <div className={styles.summaryItems}>
              {itemsToCheckout.length > 0 ? (
                itemsToCheckout.map(item => (
                  <div key={`${item.id}-${item.color}-${item.size}`} className={styles.summaryItem}>
                    <img src={item.imageUrl || item.images[0]} alt={item.name} />
                    <div className={styles.itemInfo}>
                      <p>{item.name}</p>
                      <span>Màu: {item.color} / Size: {item.size}</span>
                      <span>Số lượng: {item.quantity}</span>
                    </div>
                    <span className={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))
              ) : (
                <p className={styles.emptyMessage}>
                  Không có sản phẩm nào. 
                  <Link to="/"> Quay lại mua sắm</Link>
                </p>
              )}
            </div>

            {itemsToCheckout.length > 0 && (
              <>
                {!appliedPromo ? (
                  <div className={styles.promoCode}>
                    <input 
                      type="text" 
                      placeholder="Mã giảm giá" 
                      value={promoCodeInput} 
                      onChange={(e) => setPromoCodeInput(e.target.value)} 
                    />
                    <button type="button" onClick={handleApplyPromoCode}>Áp dụng</button>
                  </div>
                ) : (
                  <div className={styles.appliedPromo}>
                    <span>Mã áp dụng: <strong>{appliedPromo.code}</strong></span>
                    <button type="button" onClick={handleRemovePromoCode} className={styles.removePromoBtn}>Xóa</button>
                  </div>
                )}
                
                <div className={styles.calculation}>
                  <div className={styles.calcRow}>
                    <span>Tạm tính</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className={styles.calcRow}>
                    <span>Phí vận chuyển</span>
                    <span>{shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className={`${styles.calcRow} ${styles.discountRow}`}>
                      <span>Giảm giá</span>
                      <span>- {formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  
                  <div className={styles.calcTotal}>
                    <span>Tổng cộng</span>
                    <span className={styles.totalPrice}>{formatPrice(total)}</span>
                  </div>
                </div>
                <button type="submit" className={styles.placeOrderButton}>
                  {paymentMethod === 'cod' ? 'Hoàn tất đơn hàng' : 'Thanh toán VNPAY'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </PageLayout>
  );
};

export default CheckoutPage;