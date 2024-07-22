import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useOutletContext } from 'react-router-dom';
import Modal from 'react-modal';

const Members = () => {
  const { schoolId } = useOutletContext(); // Use the context to get schoolId
  const [members, setMembers] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [location, setLocation] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [modalIsOpen, setModalIsOpen] = useState(false);

  useEffect(() => {
    if (schoolId) {
      fetchMembers();
    }
  }, [schoolId]);

  const fetchMembers = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/members?schoolId=${schoolId}`);
      setMembers(response.data);
    } catch (error) {
      console.error('Error fetching members:', error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      updateMember(editingId);
    } else {
      addMember();
    }
  };

  const addMember = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/members', {
        name,
        email,
        phoneNumber,
        location,
        schoolId, // Ensure schoolId is passed
      });
      setMembers([...members, response.data]);
      resetForm();
      setErrorMessage(''); // Clear any existing error message
    } catch (error) {
      if (error.response && error.response.data.code === 'ER_DUP_ENTRY') {
        setErrorMessage(`Member with email ${email} already exists`);
      } else {
        setErrorMessage('Error adding member');
      }
      console.error('Error adding member:', error.response ? error.response.data : error.message);
      setModalIsOpen(true);
    }
  };

  const updateMember = async (id) => {
    try {
      const response = await axios.put(`http://localhost:5000/api/members/${id}`, {
        name,
        email,
        phoneNumber,
        location,
        schoolId, // Ensure schoolId is passed
      });
      setMembers(members.map(member => (member.id === id ? response.data : member)));
      resetForm();
      setErrorMessage(''); // Clear any existing error message
    } catch (error) {
      setErrorMessage('Error updating member');
      console.error('Error updating member:', error.response ? error.response.data : error.message);
      setModalIsOpen(true);
    }
  };

  const deleteMember = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/members/${id}`);
      setMembers(members.filter(member => member.id !== id));
    } catch (error) {
      setErrorMessage('Error deleting member');
      console.error('Error deleting member:', error.message);
      setModalIsOpen(true);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhoneNumber('');
    setLocation('');
    setEditingId(null);
  };

  const handleEdit = (member) => {
    setName(member.name);
    setEmail(member.email);
    setPhoneNumber(member.phoneNumber);
    setLocation(member.location);
    setEditingId(member.id);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  return (
    <div className="members-section">
      <h1>Members</h1>
      {errorMessage && (
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          contentLabel="Error"
          className="Modal"
          overlayClassName="Overlay"
        >
          <h2>Error</h2>
          <div>{errorMessage}</div>
          <button onClick={closeModal}>Close</button>
        </Modal>
      )}
      <form onSubmit={handleSubmit}>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
        <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Phone Number" required />
        <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" required />
        <button type="submit">{editingId ? 'Update Member' : 'Add Member'}</button>
        {editingId && <button type="button" onClick={resetForm}>Cancel</button>}
      </form>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone Number</th>
            <th>Location</th>
            <th>School ID</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map(member => (
            <tr key={member.id}>
              <td>{member.name}</td>
              <td>{member.email}</td>
              <td>{member.phoneNumber}</td>
              <td>{member.location}</td>
              <td>{member.schoolId}</td>
              <td>
                <button className="edit-button" onClick={() => handleEdit(member)}>Edit</button>
                <button className="delete-button" onClick={() => deleteMember(member.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Members;
