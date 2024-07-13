// services/userController.js
const User = require('../models/user'); // Ensure this is 'user' and not 'users'

const getUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.send(users);
  } catch (error) {
    res.status(500).send({ error: 'Failed to fetch users.' });
  }
};

const getUserById = async (req, res) => {
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
  try {
    const user = await User.create(req.body);
    res.status(201).send(user);
  } catch (error) {
    res.status(400).send({ error: 'Failed to create user.' });
  }
};

const updateUser = async (req, res) => {
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
