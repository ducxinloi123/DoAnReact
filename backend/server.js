require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const promotionRoutes = require('./routes/promotionRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

// --- CẬP NHẬT CẤU HÌNH CORS ---
// Cho phép Frontend từ Localhost VÀ từ DevTunnel gọi vào
app.use(cors({
 origin: true, 
  credentials: true
 // Cho phép gửi cookie/token xác thực
}));
// ------------------------------

app.use(express.json());

// Kết nối DB
mongoose
.connect('mongodb+srv://lynhanduc123_db_user:Nhanduc2025@cluster0.2uzodjw.mongodb.net/fashion_store?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('MongoDB connected...'))
  .catch((err) => console.log(err));

// Gắn routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/orders', orderRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
