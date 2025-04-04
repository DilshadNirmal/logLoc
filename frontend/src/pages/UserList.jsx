import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import axiosInstance from "../lib/axios";
import Modal from "../components/Modal";

const UserList = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editForm, setEditForm] = useState({
    UserName: "",
    Email: "",
    Role: "",
    phoneNumber: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [addForm, setAddForm] = useState({
    UserName: "",
    Email: "",
    Role: "",
    phoneNumber: "",
    Password: "",
  });
  const [error, setError] = useState("");

  const isSuperAdmin = user?.Role === "super_admin";

  useEffect(() => {
    if (user?.Role === "super_admin" || user?.Role === "admin") {
      fetchUsers();
    } else {
      navigate("/dashboard"); // Redirect non-admin users
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get("/users");
      setUsers(response.data);
      console.log(response.data);
    } catch (error) {
      if (error.response?.status === 403) {
        setError("You don't have permission to view user list");
      } else {
        setError("Error fetching users");
      }
      console.error("Error fetching users:", error);
    }
  };

  const handleEditClick = (selectedUser) => {
    setSelectedUser(selectedUser);
    setEditForm({
      UserName: selectedUser.UserName,
      Email: selectedUser.Email,
      Role: selectedUser.Role,
      phoneNumber: selectedUser.phoneNumber,
    });
    setShowEditModal(true);
  };

  const handlePasswordChange = (userId) => {
    setSelectedUser({ _id: userId });
    setShowPasswordModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.put(`/users/${selectedUser._id}`, editForm);
      fetchUsers();
      setShowEditModal(false);
    } catch (error) {
      setError(error.response?.data?.message || "Error updating user");
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      await axiosInstance.put(`/users/${selectedUser._id}/change-password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        isSuperAdmin: user.Role === "super_admin",
      });
      setShowPasswordModal(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setError(error.response?.data?.message || "Error changing password");
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.get(
        `/signup?${new URLSearchParams(addForm).toString()}`
      );
      fetchUsers();
      setShowAddModal(false);
      setAddForm({
        UserName: "",
        Email: "",
        Role: "user",
        phoneNumber: "",
        Password: "",
      });
      console.log(addForm);
    } catch (error) {
      setError(error.response?.data?.message || "Error adding user");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axiosInstance.delete(`/users/${userId}`);
        fetchUsers();
      } catch (error) {
        setError(error.response?.data?.message || "Error deleting user");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background pt-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-text mb-8">User Management</h1>
        {isSuperAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="mb-4 bg-primary text-text px-4 py-2 rounded hover:bg-primary/85"
          >
            Add new user
          </button>
        )}

        <div className="bg-secondary/10 shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-secondary">
            <thead className="bg-secondary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary">
              {users.map((user) => (
                <tr key={user._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-text">
                    {user.UserName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-text">
                    {user.Email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-text">
                    {user.Role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-text">
                    {user.phoneNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-text">
                    {isSuperAdmin && (
                      <>
                        <button
                          onClick={() => handleEditClick(user)}
                          className="text-primary hover:text-primary/80 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="text-red-500 hover:text-red-600 mr-4"
                        >
                          Delete
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handlePasswordChange(user._id)}
                      className="text-primary hover:text-primary/80"
                    >
                      Change Password
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Edit User Modal */}
        {showEditModal && (
          <Modal onClose={() => setShowEditModal(false)}>
            <h2 className="text-xl font-semibold text-primary mb-4">
              Edit User
            </h2>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-text/70 mb-2">Username</label>
                <input
                  type="text"
                  value={editForm.UserName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, UserName: e.target.value })
                  }
                  className="w-full p-2 border border-secondary rounded bg-background text-text"
                />
              </div>
              <div>
                <label className="block text-text/70 mb-2">Email</label>
                <input
                  type="email"
                  value={editForm.Email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, Email: e.target.value })
                  }
                  className="w-full p-2 border border-secondary rounded bg-background text-text"
                />
              </div>
              <div>
                <label className="block text-text/70 mb-2">Role</label>
                <select
                  value={editForm.Role}
                  onChange={(e) =>
                    setEditForm({ ...editForm, Role: e.target.value })
                  }
                  defaultValue={"user"}
                  className="w-full p-2 border border-secondary rounded bg-background text-text"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-text/70 mb-2">Phone Number</label>
                <input
                  type="text"
                  value={editForm.phoneNumber}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phoneNumber: e.target.value })
                  }
                  className="w-full p-2 border border-secondary rounded bg-background text-text"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-text py-2 rounded hover:bg-primary/80"
              >
                Save Changes
              </button>
            </form>
          </Modal>
        )}

        {/* Change Password Modal */}
        {showPasswordModal && (
          <Modal onClose={() => setShowPasswordModal(false)}>
            <h2 className="text-xl font-semibold text-primary mb-4">
              Change Password
            </h2>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {!isSuperAdmin && (
                <div>
                  <label className="block text-text/70 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        currentPassword: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-secondary rounded bg-background text-text"
                  />
                </div>
              )}
              <div>
                <label className="block text-text mb-2">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-secondary rounded bg-background text-text"
                />
              </div>
              <div>
                <label className="block text-text mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-secondary rounded bg-background text-text"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-text py-2 rounded hover:bg-primary/80"
              >
                Change Password
              </button>
            </form>
          </Modal>
        )}

        {/* add user modal */}
        {showAddModal && (
          <Modal onClose={() => setShowAddModal(false)}>
            <h2 className="text-xl font-semibold text-primary mb-4">
              Add New User
            </h2>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-text/70 mb-2">Username</label>
                <input
                  type="text"
                  value={addForm.UserName}
                  onChange={(e) =>
                    setAddForm({ ...addForm, UserName: e.target.value })
                  }
                  className="w-full p-2 border border-secondary rounded bg-background text-text"
                  required
                />
              </div>
              <div>
                <label className="block text-text/70 mb-2">Email</label>
                <input
                  type="email"
                  value={addForm.Email}
                  onChange={(e) =>
                    setAddForm({ ...addForm, Email: e.target.value })
                  }
                  className="w-full p-2 border border-secondary rounded bg-background text-text"
                  required
                />
              </div>
              <div>
                <label className="block text-text/70 mb-2">Password</label>
                <input
                  type="password"
                  value={addForm.Password}
                  onChange={(e) =>
                    setAddForm({ ...addForm, Password: e.target.value })
                  }
                  className="w-full p-2 border border-secondary rounded bg-background text-text"
                  required
                />
              </div>
              <div>
                <label className="block text-text/70 mb-2">Role</label>
                <select
                  value={addForm.Role}
                  onChange={(e) =>
                    setAddForm({ ...addForm, Role: e.target.value })
                  }
                  className="w-full p-2 border border-secondary rounded bg-background text-text"
                  required
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-text/70 mb-2">Phone Number</label>
                <input
                  type="text"
                  value={addForm.phoneNumber}
                  onChange={(e) =>
                    setAddForm({ ...addForm, phoneNumber: e.target.value })
                  }
                  className="w-full p-2 border border-secondary rounded bg-background text-text"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-text py-2 rounded hover:bg-primary/80"
              >
                Add User
              </button>
            </form>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default UserList;
