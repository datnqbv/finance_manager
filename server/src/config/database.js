const connectDB = async () => {
  // Use Sequelize (SQL) as the sole DB backend now.
  try {
    const { testConnection } = await import('./sqlserver.js');
    const { syncModels } = await import('../models/sequelize/index.js');

    await testConnection();
    await syncModels({ force: false });
    console.log(' Using SQL (Sequelize) as database backend');
  } catch (err) {
    console.error(' Error connecting to SQL database:', err.message || err);
    process.exit(1);
  }
};

export default connectDB;
