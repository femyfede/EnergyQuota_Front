import { useEffect, useRef } from 'react';
import { MdCheckCircle, MdError, MdClose } from 'react-icons/md';

const Toast = ({ message, type = 'success', onClose }) => {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const t = setTimeout(() => onCloseRef.current(), 4000);
    return () => clearTimeout(t);
  }, []);

  const isSuccess = type === 'success';

  return (
    <div
      className={`toast-enter fixed top-4 right-4 z-50 flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm max-w-sm
        ${isSuccess ? 'bg-emerald-500' : 'bg-red-500'}`}
    >
      {isSuccess ? <MdCheckCircle size={20} className="flex-shrink-0 mt-0.5" /> : <MdError size={20} className="flex-shrink-0 mt-0.5" />}
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="flex-shrink-0 hover:opacity-70 transition-opacity">
        <MdClose size={18} />
      </button>
    </div>
  );
};

export default Toast;
