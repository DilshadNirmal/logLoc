import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { mainNavigation, profileDropdownItems } from "../config/navigation";

import Logo from "../assets/images/xyma.webp";
import { CgMenuLeft, CgClose } from "react-icons/cg";
import { HiOutlineUser } from "react-icons/hi";
import { IoIosNotificationsOutline } from "react-icons/io";

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

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
  }, []);

  const handleDropdownItemClick = () => {
    setIsDropdownOpen(false);
  };

  return (
    <header
      id="header"
      className={`${
        location.pathname === "/" ? "bg-transparent" : "bg-background"
      } fixed w-full z-20 top-0 start-0 shadow-md`}
    >
      <div className="max-w-screen flex flex-wrap items-center justify-between mx-8 px-4 py-3 rtl:space-x-reverse">
        <Link
          to="https://www.xyma.in/"
          className="flex items-center space-x-3 px-8 py-2"
        >
          <img src={Logo} className="h-10 " alt="xyma-logo" />
        </Link>

        <div className="flex items-center justify-center space-x-4 order-2">
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
                  <HiOutlineUser className="h-10 w-6" />
                </button>
                {/* dropdown menu */}
                <div
                  ref={dropdownRef}
                  className={`z-50 absolute right-0 translate-x-1 mt-2 w-48 bg-text/95 rounded-lg shadow-lg transition-all duration-300 ease-in-out ${
                    isDropdownOpen
                      ? "opacity-100 visible pointer-events-auto"
                      : "opacity-0 invisible pointer-events-none"
                  }`}
                  id="user-dropdown"
                >
                  <div className="px-4 py-3 border-b border-secondary">
                    <span className="block text-sm text-primary ">
                      {user.UserName}
                    </span>
                    <span class="block text-sm text-secondary truncate">
                      {user.Email}
                    </span>
                  </div>
                  <ul className="py-2" aria-labelledby="user-menu-button">
                    {dropdownItems.map((item) => (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          className="block px-4 py-2 text-sm text-primary hover:bg-primary/10"
                          onClick={handleDropdownItemClick}
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                    <li>
                      <button
                        onClick={() => {
                          handleDropdownItemClick();
                          handleLogout();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-primary hover:bg-secondary/5 "
                      >
                        Sign out
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
              <button
                type="button"
                className="text-text bg-secondary px-4 py-2 text-center flex items-center justify-center rounded-lg relative"
              >
                <IoIosNotificationsOutline className="h-10 w-6" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  2
                </span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-light bg-primary/90 hover:bg-primary px-4 py-2 rounded-lg"
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
          className="hidden w-7/12 md:flex justify-around space-x-8 bg-secondary p-4 px-6 rounded-lg"
          id="navbar-sticky"
        >
          {mainNavigation.map((item) => (
            <Link
              to={item.path}
              key={item.path}
              className={`font-medium tracking-wide hover:text-primary transition-colors duration-300 ease-in relative ${
                location.pathname === item.path ? "text-primary" : "text-text"
              }`}
            >
              {item.name}
              {location.pathname === item.path && (
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-4 w-3/4 h-[0.3rem] rounded-2xl bg-primary"></div>
              )}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
