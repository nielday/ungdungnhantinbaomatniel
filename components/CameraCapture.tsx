'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Camera, X, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageBlob: Blob) => void;
  onError?: (error: string) => void;
}

export default function CameraCapture({ isOpen, onClose, onCapture, onError }: CameraCaptureProps) {
  const t = useTranslations();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // Start camera stream
  const startCamera = async () => {
    try {
      setError(null);

      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      const errorMessage = getCameraErrorMessage(err);
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  };

  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas ref not available');
      return;
    }

    setIsCapturing(true);
    console.log('Starting photo capture...');

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      console.error('Canvas context not available');
      setIsCapturing(false);
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    console.log('Canvas dimensions set:', canvas.width, 'x', canvas.height);

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        console.log('Photo captured successfully, blob size:', blob.size);
        const imageUrl = URL.createObjectURL(blob);
        setCapturedImage(imageUrl);
        setIsCapturing(false);
      } else {
        console.error('Failed to create blob from canvas');
        setIsCapturing(false);
        if (onError) {
          onError(t('camera.cameraError'));
        }
      }
    }, 'image/jpeg', 0.9);
  };

  // Retake photo
  const retakePhoto = () => {
    setCapturedImage(null);
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
  };

  // Confirm and send photo
  const confirmPhoto = () => {
    if (!capturedImage) {
      console.error('No captured image to confirm');
      return;
    }

    console.log('Confirming photo, captured image URL:', capturedImage);

    // Convert the captured image URL back to blob
    fetch(capturedImage)
      .then(response => {
        console.log('Fetch response status:', response.status);
        return response.blob();
      })
      .then(blob => {
        console.log('Blob created successfully, size:', blob.size);
        onCapture(blob);
        handleClose();
      })
      .catch(error => {
        console.error('Error converting image to blob:', error);
        if (onError) {
          onError(t('camera.cameraError'));
        }
      });
  };

  // Switch camera
  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Handle close
  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setError(null);
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
    onClose();
  };

  // Get user-friendly error messages
  const getCameraErrorMessage = (error: any): string => {
    switch (error.name) {
      case 'NotAllowedError':
        return t('camera.cameraError');
      case 'NotFoundError':
        return t('camera.cameraError');
      case 'NotReadableError':
        return t('camera.cameraError');
      case 'OverconstrainedError':
        return t('camera.cameraError');
      case 'SecurityError':
        return t('camera.cameraError');
      default:
        return t('camera.cameraError');
    }
  };

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (capturedImage) {
        URL.revokeObjectURL(capturedImage);
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg overflow-hidden max-w-md w-full mx-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              {capturedImage ? t('camera.title') : t('camera.title')}
            </h3>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Camera/Preview Area */}
          <div className="relative bg-black">
            {error ? (
              <div className="aspect-video flex items-center justify-center p-8">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <p className="text-white text-sm mb-4">{error}</p>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    {t('camera.retake')}
                  </button>
                </div>
              </div>
            ) : capturedImage ? (
              <div className="aspect-video relative">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video relative">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                {isCapturing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                      <p className="text-sm">{t('camera.capturing')}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Hidden canvas for capturing */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Controls */}
          <div className="p-4">
            {error ? (
              <div className="text-center">
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  {t('common.close')}
                </button>
              </div>
            ) : capturedImage ? (
              <div className="flex space-x-3">
                <button
                  onClick={retakePhoto}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{t('camera.retake')}</span>
                </button>
                <button
                  onClick={confirmPhoto}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>{t('camera.use')}</span>
                </button>
              </div>
            ) : (
              <div className="flex space-x-3">
                <button
                  onClick={switchCamera}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={capturePhoto}
                  disabled={!isStreaming || isCapturing}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Camera className="w-4 h-4" />
                  <span>{isCapturing ? t('camera.capturing') : t('camera.capture')}</span>
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
