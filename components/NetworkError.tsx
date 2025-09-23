import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from './ui/Button';

interface NetworkErrorProps {
  onRetry: () => void;
  isRetrying?: boolean;
}

export function NetworkError({ onRetry, isRetrying = false }: NetworkErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10 mb-4">
          <WifiOff className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          Connection Error
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          We're having trouble connecting to our servers. Please check your internet connection and try again.
        </p>
        <Button 
          onClick={onRetry} 
          disabled={isRetrying}
          className="flex items-center gap-2"
        >
          {isRetrying ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <Wifi className="h-4 w-4" />
              Try Again
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
