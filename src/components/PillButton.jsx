import './PillButton.css';

function PillButton({ children, onClick, type = 'button', className = '' }) {
  let buttonClass = 'pill-button';
  if (className) {
    buttonClass += ' ' + className;
  }

  return (
    <button type={type} className={buttonClass} onClick={onClick}>
      {children}
    </button>
  );
}

export default PillButton;
