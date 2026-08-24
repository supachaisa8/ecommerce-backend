require('dotenv').config();
const express = require('express');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes')
const tagRoutes = require('./routes/tagRoutes')

// server.js
const initCronJobs = require('./services/cronService'); 

const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();
app.use(express.json());

// Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes)
app.use('/api/tags', tagRoutes);

// Error Handling Middlewares (ต้องวางไว้ท้ายสุด หลัง Routes ทั้งหมด)
app.use(notFoundHandler);
app.use(errorHandler);

// รัน Cron Service ร่วมกับ Express Server
initCronJobs();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));