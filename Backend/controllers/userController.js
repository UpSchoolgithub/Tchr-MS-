const User = require('../models/user');

const getUsers = async (req, res) => {
  console.log('getUsers called');
  try {
    const users = await User.findAll();
    res.send(users);
  } catch (error) {
    res.status(500).send({ error: 'Failed to fetch users.' });
  }
};

const getUserById = async (req, res) => {
  console.log('getUserById called');
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).send({ error: 'User not found.' });
    }
    res.send(user);
  } catch (error) {
    res.status(500).send({ error: 'Failed to fetch user.' });
  }
};

const createUser = async (req, res) => {
  console.log('createUser called');
  try {
    const user = await User.create(req.body);
    res.status(201).send(user);
  } catch (error) {
    res.status(400).send({ error: 'Failed to create user.' });
  }
};

const updateUser = async (req, res) => {
  console.log('updateUser called');
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).send({ error: 'User not found.' });
    }
    await user.update(req.body);
    res.send(user);
  } catch (error) {
    res.status(400).send({ error: 'Failed to update user.' });
  }
};

const deleteUser = async (req, res) => {
  console.log('deleteUser called');
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).send({ error: 'User not found.' });
    }
    await user.destroy();
    res.send({ message: 'User deleted.' });
  } catch (error) {
    res.status(500).send({ error: 'Failed to delete user.' });
  }
};

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser };
