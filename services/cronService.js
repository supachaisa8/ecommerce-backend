const cron = require('node-cron');
const OrderModel = require('../models/orderModel');

const  initCronJobs = () => {
    //รับทุก ๆ 1 นาที
    cron.schedule('* * * * *', async () => {
    console.log('⏰ [Cron] Checking expired orders at:', new Date().toISOString());
    await OrderModel.releaseExpiredOrders();
  });
};

module.exports = initCronJobs;