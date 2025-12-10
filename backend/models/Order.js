const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
  // 1. Người mua (Vẫn giữ ObjectId vì lấy từ Token đăng nhập thật)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User', 
  },
  
  // 2. Danh sách hàng mua
  orderItems: [
    {
      name: { type: String, required: true },
      qty: { type: Number, required: true },
      image: { type: String, required: true },
      price: { type: Number, required: true },
      
      // --- PHẦN ĐÃ SỬA ---
      product: {
        type: String, // Đổi thành String để nhận mã 'ALS1550S2'
        required: true,
        // ref: 'Product', // Tạm thời đóng liên kết lại để tránh lỗi
      },
      // ------------------
    },
  ],

  // 3. Địa chỉ giao hàng
  shippingAddress: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    phone: { type: String, required: true },
  },

  // 4. Các thông tin khác
  paymentMethod: {
    type: String,
    required: true,
    default: 'COD',
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0.0,
  },
  status: {
    type: String,
    required: true,
    default: 'Chờ xử lý',
  },
  isPaid: {
    type: Boolean,
    required: true,
    default: false,
  },
  paidAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Order', orderSchema);