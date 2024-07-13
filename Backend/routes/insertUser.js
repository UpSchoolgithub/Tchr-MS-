const sequelize = require('./config/db');
const User = require('./models/User');
const bcrypt = require('bcrypt');

const insertUser = async () => {
  await sequelize.sync();

  const hashedPassword = await bcrypt.hash('123', 10);

  try {
    await User.create({
      username: 'bhavyashree@up.school',
      password: b25,
      email: 'bhavyashree@up.school',
    });
    console.log('User created successfully');
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await sequelize.close();
  }
};

insertUser();
