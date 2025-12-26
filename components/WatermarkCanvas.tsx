
import React, { useEffect, useRef } from 'react';

interface WatermarkCanvasProps {
  imageUrl: string;
  text: string;
  opacity: number;
  show: boolean;
  onProcessed: (url: string) => void;
}

export const WatermarkCanvas: React.FC<WatermarkCanvasProps> = ({ imageUrl, text, opacity, show, onProcessed }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      if (show && text) {
        ctx.save();
        const fontSize = Math.max(24, Math.floor(canvas.width / 20));
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        
        // Background shadow for better readability
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 10;
        
        ctx.fillText(text, canvas.width - (fontSize / 2), canvas.height - (fontSize / 2));
        ctx.restore();
      }

      onProcessed(canvas.toDataURL('image/png'));
    };
  }, [imageUrl, text, opacity, show, onProcessed]);

  return <canvas ref={canvasRef} className="hidden" />;
};
