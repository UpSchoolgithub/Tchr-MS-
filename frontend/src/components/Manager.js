import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Manager = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [managers, setManagers] = useState([]);

  useEffect(() => {
    fetchManagers();
  }, []);

  const fetchManagers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/managers');
      setManagers(response.data);
    } catch (error) {
      console.error('Error fetching managers:', error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/managers', { name, email, phoneNumber, password });
      fetchManagers(); // Refresh the list of managers
      resetForm();
    } catch (error) {
      console.error('Error creating manager account:', error.message);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhoneNumber('');
    setPassword('');
  };

  return (
    <div className="manager-form">
      <h2>Create Manager Account</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Phone Number</label>
          <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
        </div>
        <div>
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit">Save</button>
      </form>

      <h2>Managers</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone Number</th>
          </tr>
        </thead>
        <tbody>
          {managers.map((manager) => (
            <tr key={manager.id}>
              <td>{manager.name}</td>
              <td>{manager.email}</td>
              <td>{manager.phoneNumber}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Manager;
