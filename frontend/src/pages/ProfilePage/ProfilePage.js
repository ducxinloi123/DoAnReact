import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // 1. Import thêm useLocation
import { useAuth } from '../../contexts/AuthContext';
import PageLayout from '../../components/layout/PageLayout/PageLayout';
import styles from './ProfilePage.module.scss';
import { FiUser, FiShoppingCart, FiKey, FiLogOut, FiMail, FiPhone } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axios from 'axios';

const ProfilePage = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // 2. Khai báo hook lấy state từ router

  const [activeTab, setActiveTab] = useState('info'); 

  // State cho form thông tin
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });

  // State cho form đổi mật khẩu
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // State lưu trữ đơn hàng
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // --- 3. LOGIC TỰ ĐỘNG CHUYỂN TAB ---
  useEffect(() => {
    if (location.state && location.state.tab) {
      setActiveTab(location.state.tab);
      // Xóa state sau khi dùng để tránh bị kẹt tab khi F5 (Optional)
      window.history.replaceState({}, document.title);
    }
  }, [location]);
  // ------------------------------------

  // Tải thông tin người dùng vào form
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  // Hàm lấy lịch sử đơn hàng
  useEffect(() => {
    if (user && token) {
      const fetchOrders = async () => {
        setLoadingOrders(true);
        try {
          const config = {
            headers: { Authorization: `Bearer ${token}` },
          };
          const { data } = await axios.get('http://localhost:5000/api/orders/myorders', config);
          setOrders(data);
        } catch (error) {
          console.error("Lỗi tải đơn hàng:", error);
        } finally {
          setLoadingOrders(false);
        }
      };

      fetchOrders();
    }
  }, [user, token, activeTab]); 

  // Hàm format tiền tệ
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handleInfoSubmit = (e) => {
    e.preventDefault();
    console.log('Cập nhật:', formData);
    toast.success('Cập nhật thông tin thành công!');
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Mật khẩu mới không khớp!');
      return;
    }
    console.log('Đổi pass:', passwordData);
    toast.success('Đổi mật khẩu thành công!');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Helper để lấy class màu cho trạng thái
  const getStatusClass = (status) => {
    if (status === 'Chờ xử lý') return 'pending';
    if (status === 'Đang giao hàng' || status === 'Đang giao') return 'shipping';
    if (status === 'Đã giao hàng' || status === 'Hoàn thành') return 'success';
    if (status === 'Đã hủy') return 'cancel';
    return 'pending'; 
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'info':
        return (
          <div className={styles.formContainer}>
            <h2>Thông tin tài khoản</h2>
            <form onSubmit={handleInfoSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="email">Email</label>
                <div className={styles.inputWithIcon}>
                  <FiMail />
                  <input type="email" value={user?.email || ''} disabled />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="name">Họ và tên</label>
                <div className={styles.inputWithIcon}>
                  <FiUser />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="phone">Số điện thoại</label>
                <div className={styles.inputWithIcon}>
                  <FiPhone />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <button type="submit" className={styles.submitButton}>Lưu thay đổi</button>
            </form>
          </div>
        );

      case 'orders':
        return (
          <div className={styles.ordersContainer}>
            <h2>Lịch sử đơn hàng</h2>
            
            {loadingOrders ? (
              <p>Đang tải dữ liệu...</p>
            ) : orders.length === 0 ? (
              <p className={styles.placeholder}>Bạn chưa có đơn hàng nào.</p>
            ) : (
              <div className={styles.orderList}>
                <table className={styles.orderTable}>
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Ngày đặt</th>
                      <th>Sản phẩm</th>
                      <th>Tổng tiền</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order._id}>
                        <td>
                          <span className={styles.orderId}>#{order._id.substring(0, 8).toUpperCase()}</span>
                        </td>
                        <td>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                        <td>
                          <div className={styles.orderItemsList}>
                            {order.orderItems.map((item, index) => (
                              <div key={index} className={styles.orderItemRow}>
                                <span>{item.name}</span>
                                <span className={styles.qty}>x{item.qty}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className={styles.totalPrice}>{formatPrice(order.totalPrice)}</td>
                        <td>
                          {/* Áp dụng hàm getStatusClass để badge có màu đúng */}
                          <span className={`${styles.statusBadge} ${styles[getStatusClass(order.status)]}`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      case 'password':
        return (
          <div className={styles.formContainer}>
            <h2>Đổi mật khẩu</h2>
            <form onSubmit={handlePasswordSubmit}>
              <div className={styles.formGroup}>
                <label>Mật khẩu cũ</label>
                <div className={styles.inputWithIcon}>
                  <FiKey />
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Mật khẩu mới</label>
                <div className={styles.inputWithIcon}>
                  <FiKey />
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Xác nhận mật khẩu mới</label>
                <div className={styles.inputWithIcon}>
                  <FiKey />
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  />
                </div>
              </div>
              <button type="submit" className={styles.submitButton}>Đổi mật khẩu</button>
            </form>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <PageLayout pageTitle="Tài khoản"> 
      <div className={styles.profilePage}>
        <nav className={styles.sidebar}>
          <div className={styles.welcome}>
            <FiUser size={24} />
            <span>Xin chào,</span>
            <strong>{user?.name || user?.email}</strong>
          </div>
          <ul>
            <li className={activeTab === 'info' ? styles.active : ''} onClick={() => setActiveTab('info')}>
              <FiUser /> Thông tin tài khoản
            </li>
            <li className={activeTab === 'orders' ? styles.active : ''} onClick={() => setActiveTab('orders')}>
              <FiShoppingCart /> Lịch sử đơn hàng
            </li>
            <li className={activeTab === 'password' ? styles.active : ''} onClick={() => setActiveTab('password')}>
              <FiKey /> Đổi mật khẩu
            </li>
            <li className={styles.logout} onClick={handleLogout}>
              <FiLogOut /> Đăng xuất
            </li>
          </ul>
        </nav>
        <main className={styles.content}>
          {renderContent()}
        </main>
      </div>
    </PageLayout>
  );
};

export default ProfilePage;