const Order = require('../models/Order');

// --- 1. TẠO ĐƠN HÀNG (User) ---
const addOrderItems = async (req, res) => {
  if (req.body.orderItems && req.body.orderItems.length === 0) {
    return res.status(400).json({ message: 'Giỏ hàng đang trống' });
  }

  try {
    const order = new Order({
      user: req.user._id,
      orderItems: req.body.orderItems,
      shippingAddress: req.body.shippingAddress,
      paymentMethod: req.body.paymentMethod,
      totalPrice: req.body.totalPrice,
      status: 'Chờ xử lý' // Trạng thái mặc định
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi tạo đơn hàng: ' + error.message });
  }
};

// --- 2. LẤY LỊCH SỬ ĐƠN HÀNG (User) ---
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy danh sách' });
  }
};

// --- 3. LẤY TẤT CẢ ĐƠN HÀNG (Admin) ---
// (Mới thêm)
const getOrders = async (req, res) => {
  try {
    // .populate('user', 'id name email') -> Lấy thêm tên và email của người mua từ bảng User
    const orders = await Order.find({})
      .populate('user', 'id name email') 
      .sort({ createdAt: -1 }); // Mới nhất lên đầu
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy danh sách Admin: ' + error.message });
  }
};

// --- 4. CẬP NHẬT TRẠNG THÁI GIAO HÀNG (Admin) ---
// (Mới thêm) - Dùng khi bấm nút xe tải
const updateOrderToDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      order.status = 'Đã giao hàng'; // Cập nhật trạng thái text

      // Nếu là thanh toán COD, giao xong coi như đã thu tiền
      if(order.paymentMethod === 'cod' || order.paymentMethod === 'COD') {
          order.isPaid = true;
          order.paidAt = Date.now();
      }

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi cập nhật: ' + error.message });
  }
};

module.exports = {
  addOrderItems,
  getMyOrders,
  getOrders,              // <--- Nhớ export hàm mới
  updateOrderToDelivered, // <--- Nhớ export hàm mới
};