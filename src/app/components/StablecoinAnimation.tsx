'use client';

import { useState, useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  opacity: number;
}

const StablecoinAnimation = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [earthAngle, setEarthAngle] = useState(0);
  
  // Initialize canvas and particles
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const updateDimensions = () => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const container = canvas.parentElement;
      if (!container) return;
      
      const { width, height } = container.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      setDimensions({ width, height });
      
      // Create particles
      const particleCount = Math.floor((width * height) / 10000);
      const newParticles = Array.from({ length: particleCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        color: Math.random() > 0.8 ? '#FF8C00' : '#ffffff',
        opacity: Math.random() * 0.5 + 0.2
      }));
      
      setParticles(newParticles);
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, [canvasRef]);
  
  // Animation loop
  useEffect(() => {
    if (!canvasRef.current || particles.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let animationFrameId: number;
    
    const animate = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Update earth angle
      setEarthAngle(prev => (prev + 0.005) % (Math.PI * 2));
      
      // Clear canvas
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      
      // Draw background
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);
      
      // Draw grid pattern
      ctx.strokeStyle = 'rgba(50, 50, 50, 0.3)';
      ctx.lineWidth = 0.5;
      const gridSize = 30;
      
      for (let x = 0; x <= dimensions.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, dimensions.height);
        ctx.stroke();
      }
      
      for (let y = 0; y <= dimensions.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(dimensions.width, y);
        ctx.stroke();
      }
      
      // Update and draw particles
      const updatedParticles = particles.map(particle => {
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Bounce off edges
        if (particle.x < 0 || particle.x > dimensions.width) {
          particle.speedX *= -1;
        }
        
        if (particle.y < 0 || particle.y > dimensions.height) {
          particle.speedY *= -1;
        }
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color === '#FF8C00' 
          ? `rgba(255, 140, 0, ${particle.opacity})` 
          : `rgba(255, 255, 255, ${particle.opacity * 0.5})`;
        ctx.fill();
        
        return particle;
      });
      
      // Draw connections between nearby particles
      ctx.lineWidth = 0.3;
      for (let i = 0; i < updatedParticles.length; i++) {
        for (let j = i + 1; j < updatedParticles.length; j++) {
          const dx = updatedParticles[i].x - updatedParticles[j].x;
          const dy = updatedParticles[i].y - updatedParticles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(updatedParticles[i].x, updatedParticles[i].y);
            ctx.lineTo(updatedParticles[j].x, updatedParticles[j].y);
            
            const opacity = 1 - distance / 100;
            if (updatedParticles[i].color === '#FF8C00' || updatedParticles[j].color === '#FF8C00') {
              ctx.strokeStyle = `rgba(255, 140, 0, ${opacity * 0.3})`;
            } else {
              ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.1})`;
            }
            
            ctx.stroke();
          }
        }
      }
      
      // Draw central stablecoin visualization
      const centerX = dimensions.width / 2;
      const centerY = dimensions.height / 2;
      
      // Draw outer ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, 80, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 140, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw inner circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, 70, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 140, 0, 0.1)';
      ctx.fill();
      
      // Draw dollar symbol
      ctx.font = 'bold 60px Arial';
      ctx.fillStyle = '#FF8C00';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', centerX, centerY);
      
      // Draw pulsating glow
      const time = Date.now() / 1000;
      const glowSize = 90 + Math.sin(time * 2) * 10;
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 60,
        centerX, centerY, glowSize
      );
      gradient.addColorStop(0, 'rgba(255, 140, 0, 0.3)');
      gradient.addColorStop(1, 'rgba(255, 140, 0, 0)');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, glowSize, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Draw data points around the circle
      const dataPoints = 12;
      const radius = 120;
      
      for (let i = 0; i < dataPoints; i++) {
        const angle = (i / dataPoints) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        // Draw connecting line
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = `rgba(255, 140, 0, ${0.2 + Math.sin(time + i) * 0.1})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw data point
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#FF8C00';
        ctx.fill();
      }
      
      // Draw text labels
      const labels = ['SECURE', 'STABLE', 'VERIFIED', 'BACKED'];
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = 'white';
      
      labels.forEach((label, i) => {
        const angle = (i / labels.length) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * (radius + 30);
        const y = centerY + Math.sin(angle) * (radius + 30);
        
        ctx.fillText(label, x, y);
      });
      
      // Draw Earth-like globe
      const earthRadius = 25;
      const earthOrbitRadius = 200;
      const earthX = centerX + Math.cos(earthAngle) * earthOrbitRadius;
      const earthY = centerY + Math.sin(earthAngle) * earthOrbitRadius;
      
      // Draw orbit path
      ctx.beginPath();
      ctx.arc(centerX, centerY, earthOrbitRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw Earth
      const earthGradient = ctx.createRadialGradient(
        earthX, earthY, 0,
        earthX, earthY, earthRadius
      );
      earthGradient.addColorStop(0, 'rgba(70, 130, 180, 0.8)'); // SteelBlue
      earthGradient.addColorStop(0.5, 'rgba(30, 144, 255, 0.6)'); // DodgerBlue
      earthGradient.addColorStop(1, 'rgba(0, 0, 128, 0.4)'); // Navy
      
      ctx.beginPath();
      ctx.arc(earthX, earthY, earthRadius, 0, Math.PI * 2);
      ctx.fillStyle = earthGradient;
      ctx.fill();
      
      // Draw Earth glow
      const earthGlowGradient = ctx.createRadialGradient(
        earthX, earthY, earthRadius,
        earthX, earthY, earthRadius + 10
      );
      earthGlowGradient.addColorStop(0, 'rgba(70, 130, 180, 0.3)');
      earthGlowGradient.addColorStop(1, 'rgba(70, 130, 180, 0)');
      
      ctx.beginPath();
      ctx.arc(earthX, earthY, earthRadius + 10, 0, Math.PI * 2);
      ctx.fillStyle = earthGlowGradient;
      ctx.fill();
      
      // Draw continents (simplified)
      ctx.fillStyle = 'rgba(34, 139, 34, 0.7)'; // ForestGreen
      
      // Draw a few random "continent" shapes
      for (let i = 0; i < 5; i++) {
        const continentAngle = (i / 5) * Math.PI * 2 + time * 0.1;
        const continentX = earthX + Math.cos(continentAngle) * (earthRadius * 0.7);
        const continentY = earthY + Math.sin(continentAngle) * (earthRadius * 0.7);
        
        ctx.beginPath();
        ctx.ellipse(
          continentX, 
          continentY, 
          earthRadius * 0.3, 
          earthRadius * 0.2, 
          continentAngle, 
          0, 
          Math.PI * 2
        );
        ctx.fill();
      }
      
      // Draw connection line between Earth and central stablecoin
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(earthX, earthY);
      ctx.strokeStyle = 'rgba(255, 140, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw small satellite around Earth
      const satelliteAngle = time * 3;
      const satelliteOrbitRadius = earthRadius * 1.5;
      const satelliteX = earthX + Math.cos(satelliteAngle) * satelliteOrbitRadius;
      const satelliteY = earthY + Math.sin(satelliteAngle) * satelliteOrbitRadius;
      
      ctx.beginPath();
      ctx.arc(satelliteX, satelliteY, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#FF8C00';
      ctx.fill();
      
      setParticles(updatedParticles);
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animationFrameId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [particles, dimensions, earthAngle]);
  
  return (
    <div className="relative w-full h-full">
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0"
      />
    </div>
  );
};

export default StablecoinAnimation; 