import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Button } from './Button';

export function InstallButton() {
  const { canInstall, promptInstall } = usePWAInstall();

  if (!canInstall) return null;

  return (
    <Button
      onClick={promptInstall}
      variant="secondary"
      size="sm"
      className="mr-2"
    >
      Install App
    </Button>
  );
}
