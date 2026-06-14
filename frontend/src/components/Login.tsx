import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { apiService } from '../services/api';
import type { BiometricData } from '../types';

interface LoginProps {
  onAuthenticated: (token: string, sessionId: string) => void;
}

export function Login({ onAuthenticated }: LoginProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [fingerprintHash, setFingerprintHash] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  
  const webcamRef = useRef<Webcam>(null);

  // Generate random fingerprint hash
  const generateFingerprint = useCallback(() => {
    const hash = Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    setFingerprintHash(hash);
  }, []);

  // Capture face image
  const captureFace = useCallback(() => {
    setIsCapturing(true);
    setScanProgress(0);
    
    // Simulate scanning animation
    const scanInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(scanInterval);
          return 100;
        }
        return prev + 5;
      });
    }, 50);

    setTimeout(() => {
      if (webcamRef.current) {
        const imageSrc = webcamRef.current.getScreenshot();
        setCapturedImage(imageSrc);
        setIsCapturing(false);
        
        // Auto-generate fingerprint after face capture
        generateFingerprint();
      }
    }, 1200);
  }, [generateFingerprint]);

  // Retake photo
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setFingerprintHash('');
    setError(null);
  }, []);

  // Handle login submission
  const handleLogin = useCallback(async () => {
    if (!capturedImage || !fingerprintHash) {
      setError('Please complete both face capture and fingerprint verification');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const biometricData: BiometricData = {
        faceImage: capturedImage,
        fingerprintHash,
        timestamp: Date.now(),
      };

      const response = await apiService.authenticate(biometricData);
      
      // Store session in localStorage
      localStorage.setItem('phoenix_session', JSON.stringify({
        token: response.token,
        sessionId: response.sessionId,
        expiresAt: response.expiresAt,
      }));
      
      // Set token in API service
      apiService.setToken(response.token);
      
      // Notify parent
      onAuthenticated(response.token, response.sessionId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [capturedImage, fingerprintHash, onAuthenticated]);

  return (
    <div className="min-h-screen bg-phoenix-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-phoenix-panel border border-phoenix-border rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-phoenix-accent/20 to-transparent p-6 border-b border-phoenix-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-phoenix-accent/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-phoenix-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-phoenix-text font-mono">PROJECT PHOENIX</h1>
              <p className="text-xs text-phoenix-muted">Secure Biometric Authentication</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Face Capture Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-phoenix-text flex items-center gap-2">
              <svg className="w-4 h-4 text-phoenix-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Face Capture
            </label>
            
            <div className="relative aspect-video bg-phoenix-dark rounded-lg overflow-hidden border border-phoenix-border">
              {!capturedImage ? (
                <>
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover"
                    videoConstraints={{
                      facingMode: 'user',
                      width: 640,
                      height: 480,
                    }}
                  />
                  {isCapturing && (
                    <>
                      {/* Scan line animation */}
                      <div className="absolute inset-0 bg-gradient-to-b from-phoenix-accent/20 via-transparent to-transparent animate-scan pointer-events-none" />
                      {/* Progress bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-phoenix-border">
                        <div 
                          className="h-full bg-phoenix-accent transition-all duration-100"
                          style={{ width: `${scanProgress}%` }}
                        />
                      </div>
                      {/* Status text */}
                      <div className="absolute top-4 left-4 bg-phoenix-dark/80 px-3 py-1 rounded text-xs font-mono text-phoenix-accent">
                        SCANNING... {scanProgress}%
                      </div>
                    </>
                  )}
                  <button
                    onClick={captureFace}
                    disabled={isCapturing}
                    className="absolute bottom-4 right-4 bg-phoenix-accent text-phoenix-dark px-4 py-2 rounded-lg font-medium text-sm hover:bg-phoenix-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {isCapturing ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Capture
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="relative w-full h-full">
                  <img 
                    src={capturedImage} 
                    alt="Captured face" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-phoenix-success/20 flex items-center justify-center">
                    <div className="bg-phoenix-dark/80 px-4 py-2 rounded-lg flex items-center gap-2">
                      <svg className="w-5 h-5 text-phoenix-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-phoenix-text font-medium">Captured</span>
                    </div>
                  </div>
                  <button
                    onClick={retakePhoto}
                    className="absolute bottom-4 right-4 bg-phoenix-danger text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-phoenix-danger/90 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Retake
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Fingerprint Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-phoenix-text flex items-center gap-2">
              <svg className="w-4 h-4 text-phoenix-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.2-2.85.577-4.147" />
              </svg>
              Fingerprint Verification
            </label>
            
            <div className="bg-phoenix-dark rounded-lg p-4 border border-phoenix-border">
              {fingerprintHash ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-phoenix-success/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-phoenix-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-phoenix-text font-medium">Fingerprint Captured</p>
                      <p className="text-xs text-phoenix-muted font-mono">{fingerprintHash.substring(0, 16)}...</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFingerprintHash('')}
                    className="w-full py-2 px-4 bg-phoenix-border/50 hover:bg-phoenix-border text-phoenix-text rounded-lg text-sm transition-colors"
                  >
                    Rescan Fingerprint
                  </button>
                </div>
              ) : (
                <button
                  onClick={generateFingerprint}
                  className="w-full py-8 px-4 border-2 border-dashed border-phoenix-border hover:border-phoenix-accent rounded-lg transition-colors group"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-phoenix-accent/10 group-hover:bg-phoenix-accent/20 flex items-center justify-center transition-colors">
                      <svg className="w-8 h-8 text-phoenix-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.2-2.85.577-4.147" />
                      </svg>
                    </div>
                    <span className="text-phoenix-muted group-hover:text-phoenix-text transition-colors">
                      Click to scan fingerprint
                    </span>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-phoenix-danger/10 border border-phoenix-danger/30 rounded-lg flex items-center gap-3">
              <svg className="w-5 h-5 text-phoenix-danger flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-phoenix-danger">{error}</p>
            </div>
          )}

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={isLoading || !capturedImage || !fingerprintHash}
            className="w-full py-3 px-4 bg-phoenix-accent text-phoenix-dark font-semibold rounded-lg hover:bg-phoenix-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Authenticating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Secure Login
              </>
            )}
          </button>

          <p className="text-center text-xs text-phoenix-muted">
            All biometric data is encrypted and securely transmitted
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
