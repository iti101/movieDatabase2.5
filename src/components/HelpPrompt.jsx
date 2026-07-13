import PillButton from './PillButton';
import './HelpPrompt.css';

function HelpPrompt({
  text = 'Need help finding the right thing?',
  buttonLabel = 'Help',
  onHelp,
}) {
  return (
    <div className="help-prompt">
      <p className="help-prompt__text">{text}</p>
      <PillButton onClick={onHelp}>{buttonLabel}</PillButton>
    </div>
  );
}

export default HelpPrompt;
