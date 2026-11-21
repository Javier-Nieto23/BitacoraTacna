import { useState, useEffect } from 'react';

/**
 * Hook para detectar el tipo de dispositivo
 * @returns {string} - 'desktop' | 'tablet' | 'mobile'
 */
export const useDeviceDetection = () => {
  const [deviceType, setDeviceType] = useState('desktop');

  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth;
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileUA = /mobile|android|iphone|ipad|phone|tablet/.test(userAgent);
      const isTabletUA = /ipad|android/.test(userAgent) && !/mobile/.test(userAgent);

      // Detección por tamaño y User Agent
      if (width < 768 && isMobileUA) {
        setDeviceType('mobile');
      } else if (width >= 768 && width < 1024 && isTabletUA) {
        setDeviceType('tablet');
      } else if (width >= 1024) {
        setDeviceType('desktop');
      } else if (width < 768) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    detectDevice();
    window.addEventListener('resize', detectDevice);

    return () => {
      window.removeEventListener('resize', detectDevice);
    };
  }, []);

  return deviceType;
};

/**
 * Hook para obtener información detallada del dispositivo
 * @returns {object} - Información detallada del dispositivo
 */
export const useDeviceInfo = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    type: 'desktop',
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    userAgent: '',
    os: 'unknown',
    browser: 'unknown',
  });

  useEffect(() => {
    const detectDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const userAgent = navigator.userAgent;

      // Detectar tipo de dispositivo
      let type = 'desktop';
      let isMobile = false;
      let isTablet = false;
      let isDesktop = true;

      if (width < 768) {
        type = 'mobile';
        isMobile = true;
        isDesktop = false;
        isTablet = false;
      } else if (width >= 768 && width < 1024) {
        type = 'tablet';
        isTablet = true;
        isDesktop = false;
        isMobile = false;
      } else {
        type = 'desktop';
        isDesktop = true;
        isMobile = false;
        isTablet = false;
      }

      // Detectar SO
      let os = 'unknown';
      if (userAgent.indexOf('Win') > -1) os = 'Windows';
      else if (userAgent.indexOf('Mac') > -1) os = 'MacOS';
      else if (userAgent.indexOf('Linux') > -1) os = 'Linux';
      else if (userAgent.indexOf('Android') > -1) os = 'Android';
      else if (userAgent.indexOf('iPhone') > -1 || userAgent.indexOf('iPad') > -1) os = 'iOS';

      // Detectar navegador
      let browser = 'unknown';
      if (userAgent.indexOf('Firefox') > -1) browser = 'Firefox';
      else if (userAgent.indexOf('Safari') > -1 && userAgent.indexOf('Chrome') === -1) browser = 'Safari';
      else if (userAgent.indexOf('Chrome') > -1) browser = 'Chrome';
      else if (userAgent.indexOf('Edge') > -1) browser = 'Edge';
      else if (userAgent.indexOf('Opera') > -1) browser = 'Opera';

      setDeviceInfo({
        type,
        width,
        height,
        isMobile,
        isTablet,
        isDesktop,
        userAgent,
        os,
        browser,
      });
    };

    detectDeviceInfo();
    window.addEventListener('resize', detectDeviceInfo);

    return () => {
      window.removeEventListener('resize', detectDeviceInfo);
    };
  }, []);

  return deviceInfo;
};

/**
 * Detectar si el usuario es de escritorio en su primera visita
 * @returns {boolean}
 */
export const isDesktopDevice = () => {
  if (typeof window === 'undefined') return true;
  
  const width = window.innerWidth;
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobileUA = /mobile|android|iphone|webos/.test(userAgent);
  
  // Si el ancho es desktop y no tiene User Agent mobile, es desktop
  return width >= 1024 && !isMobileUA;
};

/**
 * Detectar si es dispositivo táctil
 * @returns {boolean}
 */
export const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  
  return (
    (typeof window !== 'undefined' && 
     ('ontouchstart' in window || 
      navigator.maxTouchPoints > 0 || 
      navigator.msMaxTouchPoints > 0))
  );
};

/**
 * Detectar orientación del dispositivo
 * @returns {string} - 'portrait' | 'landscape'
 */
export const useDeviceOrientation = () => {
  const [orientation, setOrientation] = useState('portrait');

  useEffect(() => {
    const detectOrientation = () => {
      if (window.innerWidth > window.innerHeight) {
        setOrientation('landscape');
      } else {
        setOrientation('portrait');
      }
    };

    detectOrientation();
    window.addEventListener('orientationchange', detectOrientation);
    window.addEventListener('resize', detectOrientation);

    return () => {
      window.removeEventListener('orientationchange', detectOrientation);
      window.removeEventListener('resize', detectOrientation);
    };
  }, []);

  return orientation;
};
