/**
 * Ejemplo de componente responsivo
 * Este archivo muestra cómo usar los hooks de detección de dispositivos
 */

import { useDeviceInfo, isTouchDevice, useDeviceOrientation } from '../utils/deviceDetection';

export default function ResponsiveExample() {
  const deviceInfo = useDeviceInfo();
  const orientation = useDeviceOrientation();
  const isTouch = isTouchDevice();

  console.log('Device Info:', {
    type: deviceInfo.type,
    width: deviceInfo.width,
    height: deviceInfo.height,
    os: deviceInfo.os,
    browser: deviceInfo.browser,
    orientation,
    isTouch,
  });

  return (
    <div className={`example-container ${deviceInfo.type}-version`}>
      {/* Header que cambia según dispositivo */}
      <header className="example-header">
        <h1>
          {deviceInfo.isDesktop && '🖥️ Estás en Desktop'}
          {deviceInfo.isTablet && '📱 Estás en Tablet'}
          {deviceInfo.isMobile && '📞 Estás en Móvil'}
        </h1>
      </header>

      {/* Información del dispositivo */}
      <section className="device-info">
        <div className="info-card">
          <h3>Información del Dispositivo</h3>
          <ul>
            <li><strong>Tipo:</strong> {deviceInfo.type}</li>
            <li><strong>Resolución:</strong> {deviceInfo.width} x {deviceInfo.height}px</li>
            <li><strong>SO:</strong> {deviceInfo.os}</li>
            <li><strong>Navegador:</strong> {deviceInfo.browser}</li>
            <li><strong>Orientación:</strong> {orientation}</li>
            <li><strong>Pantalla táctil:</strong> {isTouch ? 'Sí ✓' : 'No'}</li>
          </ul>
        </div>
      </section>

      {/* Contenido condicional por dispositivo */}
      {deviceInfo.isDesktop && (
        <section className="desktop-only">
          <h2>🖥️ Contenido solo para Desktop</h2>
          <p>
            En el desktop puedes mostrar múltiples columnas, 
            gráficos complejos o paneles laterales.
          </p>
          <div className="desktop-grid">
            <div>Columna 1</div>
            <div>Columna 2</div>
            <div>Columna 3</div>
            <div>Columna 4</div>
          </div>
        </section>
      )}

      {deviceInfo.isTablet && (
        <section className="tablet-only">
          <h2>📱 Contenido solo para Tablet</h2>
          <p>En tablet puedes mostrar dos columnas o layouts intermedios.</p>
          <div className="tablet-grid">
            <div>Columna 1</div>
            <div>Columna 2</div>
          </div>
        </section>
      )}

      {deviceInfo.isMobile && (
        <section className="mobile-only">
          <h2>📞 Contenido solo para Móvil</h2>
          <p>En móvil todo es de una sola columna y optimizado para toque.</p>
          <div className="mobile-grid">
            <div>Fila 1</div>
            <div>Fila 2</div>
            <div>Fila 3</div>
          </div>
        </section>
      )}

      {/* Controles según tipo de dispositivo */}
      <section className="controls">
        <h3>Controles Adaptativos</h3>
        
        {deviceInfo.isMobile && (
          <div className="mobile-controls">
            <button>Botón Móvil 1</button>
            <button>Botón Móvil 2</button>
          </div>
        )}

        {deviceInfo.isTablet && (
          <div className="tablet-controls">
            <button>Botón Tablet 1</button>
            <button>Botón Tablet 2</button>
            <button>Botón Tablet 3</button>
          </div>
        )}

        {deviceInfo.isDesktop && (
          <div className="desktop-controls">
            <button>Botón Desktop 1</button>
            <button>Botón Desktop 2</button>
            <button>Botón Desktop 3</button>
            <button>Botón Desktop 4</button>
          </div>
        )}
      </section>

      {/* Interactividad según tipo de entrada */}
      <section className="interaction">
        <h3>Modo de Interacción</h3>
        {isTouch ? (
          <p>
            ✋ Estás usando una pantalla táctil. 
            Se muestran controles optimizados para toque.
          </p>
        ) : (
          <p>
            🖱️ Estás usando mouse/trackpad. 
            Se muestran controles optimizados para click.
          </p>
        )}
      </section>
    </div>
  );
}
