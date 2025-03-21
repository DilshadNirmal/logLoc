const Modal = ({ children, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black opacity-85">
      <div className="h-full flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-500"
          >
            &times;
          </button>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
