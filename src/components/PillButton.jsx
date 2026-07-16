import './PillButton.css';

function PillButton({ children, onClick, type = 'button', className = '', disabled = false }) {
  let buttonClass = 'pill-button';
  if (className) {
    buttonClass += ' ' + className;
  }

  return (
    <button type={type} className={buttonClass} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export default PillButton;
