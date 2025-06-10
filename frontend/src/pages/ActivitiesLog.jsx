// frontend/src/pages/ActivitiesLog.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Table from "../components/Table";
import axiosInstance from "../lib/axios";
import { signal } from "@preact/signals-react";

const navHeight = signal(0);
const contentHeight = signal(0);

const ActivitiesLog = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = useState({
    userId: "",
    type: "",
    startDate: "",
    endDate: "",
  });

  const columns = [
    { key: "user", header: "User" },
    { key: "type", header: "Activity Type" },
    { key: "ipAddress", header: "IP Address" },
    { key: "location", header: "Location" },
    { key: "createdAt", header: "Date & Time" },
  ];

  useEffect(() => {
    const updateDimensions = () => {
      const header = document.querySelector("header");
      if (header) navHeight.value = header.offsetHeight;
      if (window.innerWidth >= 1024) {
        contentHeight.value = window.innerHeight - 100;
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const fetchActivities = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };

      const response = await axiosInstance.get("/auth/admin/activities", {
        params,
      });

      setActivities(response.data.activities || []);
      setPagination((prev) => ({
        ...prev,
        totalItems: response.data.totalItems || 0,
        totalPages: response.data.totalPages || 1,
      }));
    } catch (error) {
      console.error("Error fetching activities:", error);
      if (error.response?.status === 403) {
        setError(
          "You don't have permission to view activities. Only super admins can access this page."
        );
      } else {
        setError("Failed to load activities. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.Role !== "super_admin") {
      setError(
        "You don't have permission to view activities. Only super admins can access this page."
      );
      setLoading(false);
      return;
    }
    fetchActivities();
  }, [pagination.page, filters, user]);

  const formatActivityData = (activities) => {
    if (!Array.isArray(activities)) return [];

    return activities.map((activity) => {
      const userInfo = activity.user || {};
      const location = activity.location || {};

      return {
        ...activity,
        user: userInfo.UserName || "System",
        type: activity.type
          ? activity.type
              .split("_")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")
          : "Unknown",
        location:
          [location.city, location.region, location.country]
            .filter(Boolean)
            .join(", ") || "N/A",
        createdAt: activity.createdAt
          ? new Date(activity.createdAt).toLocaleString()
          : "N/A",
      };
    });
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  if (!user) {
    return <div>Loading user data...</div>;
  }

  if (loading) {
    return <div className="p-4">Loading activities...</div>;
  }

  if (error) {
    return (
      <div className="p-4">
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4"
          role="alert"
        >
          <p className="font-bold">Access Denied</p>
          <p>{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <section
      className="bg-background text-text min-h-screen w-full overflow-x-hidden"
      style={{ marginTop: `${navHeight.value}px` }}
    >
      <div className="p-4 md:p-6 w-[80%] mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary tracking-wider">
            Activities Log
          </h1>
        </div>
        {/* Filters */}
        <div className="bg-background/70 p-4 rounded-lg mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                User ID
              </label>
              <input
                type="text"
                name="userId"
                value={filters.userId}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 bg-background border border-secondary rounded-md text-text"
                placeholder="Filter by User ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Activity Type
              </label>
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 bg-background border border-secondary rounded-md text-text"
              >
                <option value="">All Types</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="location_update">Location Update</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                From Date
              </label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 bg-background border border-secondary rounded-md text-text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                To Date
              </label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 bg-background border border-secondary rounded-md text-text"
              />
            </div>
          </div>
        </div>
        <Table
          data={formatActivityData(activities)}
          columns={columns}
          isLoading={loading}
        />
        {pagination.totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-4 py-2 bg-primary/50 text-text rounded-md disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-text">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 bg-primary/50 text-text rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ActivitiesLog;
