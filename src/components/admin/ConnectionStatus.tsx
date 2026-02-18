import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

type EndpointStatus = 'checking' | 'connected' | 'failed';

interface Endpoint {
  name: string;
  status: EndpointStatus;
  error?: string;
}

interface ConnectionStatusProps {
  isConnected: boolean;
  endpoints: Endpoint[];
}

export function ConnectionStatus({ isConnected, endpoints }: ConnectionStatusProps) {
  const allHealthy = endpoints.every(e => e.status === 'connected');

  return (
    <div className={`rounded-lg border p-4 ${allHealthy ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {allHealthy ? (
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600" />
          )}
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold ${allHealthy ? 'text-emerald-900' : 'text-amber-900'}`}>
            {allHealthy ? 'Backend Connected' : 'Connection Issues Detected'}
          </h3>
          <p className={`text-sm mt-1 ${allHealthy ? 'text-emerald-800' : 'text-amber-800'}`}>
            API Status: {isConnected ? 'Online' : 'Offline'}
          </p>
          
          <div className="mt-3 space-y-2">
            {endpoints.map((endpoint, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${
                  endpoint.status === 'connected' ? 'bg-emerald-500' :
                  endpoint.status === 'failed' ? 'bg-red-500' :
                  'bg-amber-500'
                }`} />
                <span className="font-medium">{endpoint.name}:</span>
                <span className={endpoint.status === 'connected' ? 'text-emerald-700' : endpoint.status === 'failed' ? 'text-red-700' : 'text-amber-700'}>
                  {endpoint.status === 'checking' && <span>Checking...</span>}
                  {endpoint.status === 'connected' && <span>✓ Connected</span>}
                  {endpoint.status === 'failed' && <span>✗ Failed {endpoint.error && `(${endpoint.error})`}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminConnectionMonitor() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([
    { name: 'API Health', status: 'checking' },
    { name: 'Auth', status: 'checking' },
    { name: 'Teams', status: 'checking' },
    { name: 'Judges', status: 'checking' },
    { name: 'Domains', status: 'checking' },
  ]);

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const testConnections = async () => {
      // @ts-ignore - Vite env variables
      const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:4000';
      const token = localStorage.getItem('auth_token');

      const newEndpoints: Endpoint[] = [...endpoints];

      // Test health
      try {
        const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(5000) });
        newEndpoints[0] = { name: 'API Health', status: res.ok ? 'connected' : 'failed', error: res.status.toString() };
        setIsConnected(res.ok);
      } catch (e: any) {
        newEndpoints[0] = { name: 'API Health', status: 'failed', error: e.message || 'Timeout' };
        setIsConnected(false);
      }

      // If token exists, test other endpoints
      if (token) {
        const headers = { Authorization: `Bearer ${token}` };

        // Test Teams
        try {
          const res = await fetch(`${API_BASE_URL}/api/teams`, { headers, signal: AbortSignal.timeout(5000) });
          newEndpoints[2] = { name: 'Teams', status: res.ok ? 'connected' : 'failed', error: res.status.toString() };
        } catch (e: any) {
          newEndpoints[2] = { name: 'Teams', status: 'failed', error: e.message };
        }

        // Test Judges
        try {
          const res = await fetch(`${API_BASE_URL}/api/judges`, { headers, signal: AbortSignal.timeout(5000) });
          newEndpoints[3] = { name: 'Judges', status: res.ok ? 'connected' : 'failed', error: res.status.toString() };
        } catch (e: any) {
          newEndpoints[3] = { name: 'Judges', status: 'failed', error: e.message };
        }

        // Test Domains
        try {
          const res = await fetch(`${API_BASE_URL}/api/domains`, { signal: AbortSignal.timeout(5000) });
          newEndpoints[4] = { name: 'Domains', status: res.ok ? 'connected' : 'failed', error: res.status.toString() };
        } catch (e: any) {
          newEndpoints[4] = { name: 'Domains', status: 'failed', error: e.message };
        }

        newEndpoints[1] = { name: 'Auth', status: 'connected' };
      } else {
        newEndpoints[1] = { name: 'Auth', status: 'failed', error: 'No token' };
      }

      setEndpoints(newEndpoints);
    };

    testConnections();
    const interval = setInterval(testConnections, 30000); // Re-test every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return <ConnectionStatus isConnected={isConnected} endpoints={endpoints} />;
}
