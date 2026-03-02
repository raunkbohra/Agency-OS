'use client';

import { useRef, useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';

interface SignatureCanvasProps {
  onSignatureChange: (dataUrl: string) => void;
}

export default function SignatureCanvas({ onSignatureChange }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  // Setup canvas on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = 200;

    // Configure drawing context
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';

    // Set white background
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Helper function to get coordinates from mouse or touch event
  const getCoordinates = (e: any): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if (e instanceof TouchEvent || e.touches) {
      const touch = e.touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  // Start drawing
  const handleDrawStart = (e: any) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { x, y } = getCoordinates(e);
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  // Draw
  const handleDrawMove = (e: any) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Mark canvas as not empty
    if (isEmpty) {
      setIsEmpty(false);
    }

    // Emit the signature data
    onSignatureChange(canvas.toDataURL('image/png'));
  };

  // Stop drawing
  const handleDrawEnd = () => {
    setIsDrawing(false);
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    if (isDrawing) {
      setIsDrawing(false);
    }
  };

  // Clear canvas
  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onSignatureChange('');
  };

  return (
    <div className="space-y-3">
      <div className="border-2 border-dashed border-border-default rounded-lg p-4 bg-bg-tertiary">
        <canvas
          ref={canvasRef}
          className="w-full bg-white rounded-md cursor-crosshair touch-none"
          onMouseDown={handleDrawStart}
          onMouseMove={handleDrawMove}
          onMouseUp={handleDrawEnd}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleDrawStart}
          onTouchMove={handleDrawMove}
          onTouchEnd={handleDrawEnd}
        />
        <p className="text-xs text-text-tertiary mt-3 text-center">
          Sign above using your mouse or finger
        </p>
      </div>

      <button
        onClick={handleClear}
        disabled={isEmpty}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-border-default text-text-secondary text-sm font-medium rounded-lg hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Trash2 className="h-4 w-4" />
        Clear Signature
      </button>
    </div>
  );
}
