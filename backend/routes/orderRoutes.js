const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Import đủ 4 hàm từ Controller
const { 
  addOrderItems, 
  getMyOrders, 
  getOrders, 
  updateOrderToDelivered 
} = require('../controllers/orderController');

// Middleware bảo vệ (Auth)
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
      
      // Logic lấy ID user an toàn
      const userId = decoded.user?.id || decoded.id || decoded._id || decoded.userId;
      req.user = { _id: userId };
      
      next();
    } catch (error) {
      res.status(401).json({ message: 'Token không hợp lệ' });
    }
  } else {
    res.status(401).json({ message: 'Chưa đăng nhập' });
  }
};

// --- Middleware kiểm tra Admin (Optional) ---
// Bạn có thể thêm vào sau nếu User Model có trường isAdmin: true/false
const admin = (req, res, next) => {
    // Tạm thời cho qua để test, sau này bạn check req.user.isAdmin ở đây
    next(); 
};

// --- ĐỊNH NGHĨA ROUTES ---

// 1. User thường
router.post('/', protect, addOrderItems);
router.get('/myorders', protect, getMyOrders);

// 2. Admin (Thêm protect để đảm bảo phải đăng nhập mới xem được)
router.get('/', protect, getOrders); // Xem tất cả
router.put('/:id/deliver', protect, updateOrderToDelivered); // Xác nhận giao

module.exports = router;