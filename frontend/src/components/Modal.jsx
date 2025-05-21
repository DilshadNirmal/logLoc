import { CgClose } from "react-icons/cg";

const Modal = ({ children, onClose }) => {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-background/55 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-background rounded-lg shadow-lg p-6 max-w-sm w-full relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          <CgClose className="w-6 h-6" />
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
