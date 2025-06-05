import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { mainNavigation, profileDropdownItems } from "../config/navigation";

import Logo from "../assets/images/xyma.webp";
import { CgMenuLeft, CgClose } from "react-icons/cg";
import { HiOutlineUser } from "react-icons/hi";
import { IoIosNotificationsOutline } from "react-icons/io";
import { FaBell, FaBellSlash } from "react-icons/fa";
import axiosInstance from "../lib/axios";
import ChangePasswordModal from "../components/ChangePasswordModal";
import { showChangePasswordModal } from "../signals/settings";
import Modal from "./Modal";
import { useSignals } from "@preact/signals-react/runtime";

const Navbar = () => {
  useSignals();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const userRole = user?.Role?.toLowerCase() || "user";
  const dropdownItems = profileDropdownItems[userRole] || [];

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isDropdownOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleDropdownItemClick = () => {
    setIsDropdownOpen(false);
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await axiosInstance.get("/notifications");
      console.log("fetch notifications:", response);
      setNotifications(response.data);
      setUnreadCount(response.data.filter((n) => !n.read).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Mark notification as read
  const markAsRead = async (id) => {
    try {
      await axiosInstance.patch(`/notifications/${id}/read`);
      console.log("mard id", id);
      setNotifications(
        notifications.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await axiosInstance.patch("/notifications/read-all");
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      id="header"
      className={`${
        location.pathname === "/" ? "bg-transparent" : "bg-background"
      } fixed w-full z-20 top-0 start-0 shadow-md`}
    >
      <div className="max-w-screen flex flex-wrap items-center justify-between mx-4 md:mx-6 2xl:mx-8 px-2 md:px-2 2xl:px-4 py-3 md:py-2 2xl:py-3 rtl:space-x-reverse">
        <Link
          to="https://www.xyma.in/"
          className="flex items-center space-x-3 px-8 md:px-6 2xl:px-8 py-2 md:py-1.5 2xl:py-2"
        >
          <img src={Logo} className="h-8 md:h-[30px] 2xl:h-8" alt="xyma-logo" />
        </Link>

        <div className="flex items-center justify-center space-x-4 md:space-x-2 2xl:space-x-4 order-2">
          {user ? (
            <>
              <div className="relative">
                <button
                  ref={buttonRef}
                  type="button"
                  className="text-text bg-secondary px-4 py-2 text-center flex items-center justify-center rounded-lg"
                  onClick={() => {
                    setIsDropdownOpen(!isDropdownOpen);
                  }}
                >
                  <span className="sr-only">Open user menu</span>

                  <HiOutlineUser className="h-6 md:h-8 2xl:h-10 w-5 md:w-5 2xl:w-6" />
                </button>
                {/* dropdown menu */}
                <div
                  ref={dropdownRef}
                  className={`z-50 absolute right-0 translate-x-1 mt-2 w-42 md:w-40 2xl:w-48 bg-text rounded-lg shadow-lg transition-all duration-300 ease-in-out ${
                    isDropdownOpen
                      ? "opacity-100 visible pointer-events-auto"
                      : "opacity-0 invisible pointer-events-none"
                  }`}
                  id="user-dropdown"
                >
                  <div className="px-4 md:px-3 2xl:px-4 py-3 md:py-2 2xl:py-3 border-b border-secondary">
                    <span className="block text-sm text-primary ">
                      {user.UserName}
                    </span>
                    <span className="block text-sm md:text-xs 2xl:text-sm text-secondary/90 truncate">
                      {user.Email}
                    </span>
                  </div>
                  <ul
                    className="py-2 md:py-1.5 2xl:py-2"
                    aria-labelledby="user-menu-button"
                  >
                    {dropdownItems.map((item) =>
                      item.name === "Change Password" ? (
                        <li key={item.name}>
                          {" "}
                          {/* Use item.name or a unique key */}
                          <button
                            onClick={() => {
                              showChangePasswordModal.value = true;
                              handleDropdownItemClick(); // Close dropdown on click
                            }}
                            className="block w-full text-left px-4 md:px-3 2xl:px-4 py-2 md:py-1.5 2xl:py-2 text-sm md:text-xs 2xl:text-sm text-primary hover:bg-primary/10"
                          >
                            Change Password
                          </button>
                        </li>
                      ) : (
                        <li key={item.path}>
                          <Link
                            to={item.path}
                            className="block px-4 md:px-3 2xl:px-4 py-2 md:py-1.5 2xl:py-2 text-sm md:text-xs 2xl:text-sm text-primary hover:bg-primary/10"
                            onClick={handleDropdownItemClick}
                          >
                            {item.name}
                          </Link>
                        </li>
                      )
                    )}
                    <li>
                      <button
                        onClick={() => {
                          handleDropdownItemClick();
                          handleLogout();
                        }}
                        className="block w-full text-left px-4 md:px-3 2xl:px-4 py-2 md:py-1.5 2xl:py-2 text-sm md:text-xs 2xl:text-sm text-primary hover:bg-secondary/5 "
                      >
                        Sign out
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="relative ml-4">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="text-text bg-secondary p-2 md:p-4 rounded-lg hover:bg-secondary/80 transition-colors relative"
                >
                  {unreadCount > 0 ? (
                    <FaBell className="h-5 w-5" />
                  ) : (
                    <FaBellSlash className="h-5 w-5" />
                  )}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-secondary rounded-md shadow-lg overflow-hidden z-50">
                    <div className="p-3 border-b border-background bg-background/30 flex justify-between items-center">
                      <h3 className="text-sm font-medium text-text">
                        Notifications
                      </h3>
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-primary hover:text-blue-800"
                      >
                        Mark all as read
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div
                            key={notification._id}
                            className={`p-3 border-b border-background hover:bg-background/50 cursor-pointer ${
                              !notification.read
                                ? "bg-background/20"
                                : "bg-background/35"
                            }`}
                            onClick={() => {
                              markAsRead(notification._id);
                              // Navigate to relevant page if needed
                              // navigate(`/sensors/${notification.sensorId}`);
                            }}
                          >
                            <div className="flex items-start">
                              <div className="flex-shrink-0 pt-0.5">
                                <div
                                  className={`h-2 w-2 rounded-full ${
                                    notification.severity === "high"
                                      ? "bg-red-500"
                                      : notification.severity === "medium"
                                      ? "bg-yellow-500"
                                      : "bg-blue-500"
                                  }`}
                                />
                              </div>
                              <div className="ml-3 w-0 flex-1">
                                <p
                                  className={`  ${
                                    !notification.read
                                      ? "font-medium text-text text-sm"
                                      : "font-normal text-text/75 text-xs"
                                  }`}
                                >
                                  {notification.sensorId?.name ||
                                    "Sensor Alert"}
                                </p>
                                <p
                                  className={`mt-1  ${
                                    !notification.read
                                      ? "text-sm text-text/80"
                                      : "font-normal text-text/65 text-xs"
                                  }`}
                                >
                                  {notification.message}
                                </p>
                                <p className="mt-1 text-xs text-text/60">
                                  {new Date(
                                    notification.timestamp
                                  ).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-gray-500">
                          No notifications
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-light bg-primary/90 hover:bg-primary px-4 md:px-3 2xl:px-4 py-2 md:py-1.5 2xl:py-2 rounded-lg"
              >
                Login
              </Link>
            </>
          )}

          <button
            data-collapse-toggle="navbar-sticky"
            type="button"
            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-light bg-primary rounded-lg md:hidden hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-secondary"
            aria-controls="navbar-sticky"
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <CgClose className="w-6 h-6" />
            ) : (
              <CgMenuLeft className="w-6 h-6" />
            )}
            <span className="sr-only">Open main menu</span>
          </button>
        </div>

        {/* mobile menu */}
        <div
          className={`${
            isMobileMenuOpen
              ? "translate-y-0 opacity-100"
              : "-translate-y-full opacity-0 hidden"
          } w-3/4 absolute top-full left-1/2 -translate-x-1/2 bg-primary/90 backdrop-blur-md shadow-xl transform transition-all duration-300 ease-in-out rounded-b-lg`}
        >
          <ul className="flex flex-col p-4 font-medium">
            <li>
              <Link
                to="/"
                className="block py-3 px-4 text-xl text-light hover:text-light/85"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                to="/reports"
                className="block py-3 px-4 text-xl text-light hover:text-light/85"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Reports
              </Link>
            </li>
            <li>
              <Link
                to="/analytics"
                className="block py-3 px-4 text-xl text-light hover:text-light/85"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Analytics
              </Link>
            </li>
            <li>
              <Link
                to="/settings"
                className="block py-3 px-4 text-xl text-light hover:text-light/85"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Settings
              </Link>
            </li>
          </ul>
        </div>
        <nav
          className="hidden w-7/12 md:w-6/12 2xl:w-7/12 md:flex justify-around space-x-8 md:space-x-6 2xl:space-x-8 bg-secondary p-4 md:p-3 2xl:p-4 px-6 md:px-4 2xl:px-6 rounded-lg"
          id="navbar-sticky"
        >
          {mainNavigation.map((item) => (
            <Link
              to={item.path}
              key={item.path}
              className={`font-medium text-base md:text-xs 2xl:text-base tracking-wide hover:text-primary transition-colors duration-300 ease-in relative ${
                location.pathname === item.path ? "text-primary" : "text-text"
              }`}
            >
              {item.name}
              {location.pathname === item.path && (
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-4 md:-bottom-3 2xl:-bottom-4 w-3/4 h-[0.28rem] md:h-[0.2rem] 2xl:h-[0.28rem] rounded-2xl bg-primary"></div>
              )}
            </Link>
          ))}
        </nav>
      </div>
      {showChangePasswordModal.value && (
        <Modal onClose={() => (showChangePasswordModal.value = false)}>
          <ChangePasswordModal />
        </Modal>
      )}
    </header>
  );
};

export default Navbar;
