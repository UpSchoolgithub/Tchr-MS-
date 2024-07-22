const bcrypt = require('bcrypt');
const { Manager } = require('../models');
const { sequelize } = require('../models');

async function hashPasswords() {
  try {
    await sequelize.authenticate();
    const managers = await Manager.findAll();
    for (const manager of managers) {
      const hashedPassword = await bcrypt.hash(manager.password, 10);
      await manager.update({ password: hashedPassword });
    }
    console.log('Passwords hashed successfully');
  } catch (error) {
    console.error('Error hashing passwords:', error);
  } finally {
    await sequelize.close();
  }
}

hashPasswords();
