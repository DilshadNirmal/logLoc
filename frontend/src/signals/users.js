import { signal } from "@preact/signals-react";
import axiosInstance from "../lib/axios";

export const users = signal([]);
export const selectedUser = signal(null);
export const showEditModal = signal(false);
export const showPasswordModal = signal(false);
export const showAddModal = signal(false);
export const error = signal("");

export const editForm = signal({
  UserName: "",
  Email: "",
  Role: "",
  phoneNumber: "",
});

export const passwordForm = signal({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

export const addForm = signal({
  UserName: "",
  Email: "",
  Role: "",
  phoneNumber: "",
  Password: "",
});

export const fetchUsers = async () => {
  try {
    const response = await axiosInstance.get("/users");
    users.value = response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
  }
};

export const handleEditSubmit = async () => {
  try {
    await axiosInstance.put(`/users/${selectedUser.value._id}`, editForm.value);
    await fetchUsers();
    showEditModal.value = false;
  } catch (err) {
    error.value = err.response?.data?.message || "Error updating user";
  }
};

export const handlePasswordSubmit = async (isSuperAdmin) => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    error.value = "Passwords do not match";
    return;
  }
  try {
    await axiosInstance.put(`/users/${selectedUser.value._id}/change-password`, {
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword,
      isSuperAdmin,
    });
    showPasswordModal.value = false;
    passwordForm.value = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    };
  } catch (err) {
    error.value = err.response?.data?.message || "Error changing password";
  }
};

export const handleAddSubmit = async () => {
  try {
    await axiosInstance.get(`/signup?${new URLSearchParams(addForm.value).toString()}`);
    await fetchUsers();
    showAddModal.value = false;
    addForm.value = {
      UserName: "",
      Email: "",
      Role: "user",
      phoneNumber: "",
      Password: "",
    };
  } catch (err) {
    error.value = err.response?.data?.message || "Error adding user";
  }
};

export const handleDeleteUser = async (userId) => {
  if (window.confirm("Are you sure you want to delete this user?")) {
    try {
      await axiosInstance.delete(`/users/${userId}`);
      await fetchUsers();
    } catch (err) {
      error.value = err.response?.data?.message || "Error deleting user";
    }
  }
};