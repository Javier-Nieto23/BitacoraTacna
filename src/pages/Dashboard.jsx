import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsQR from 'jsqr';
import '../styles/Dashboard.css';
import { useDeviceInfo, isDesktopDevice } from '../utils/deviceDetection';

export default function Dashboard() {
  const navigate = useNavigate();
  const deviceInfo = useDeviceInfo();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [showForm, setShowForm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scannedQR, setScannedQR] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isDesktop, setIsDesktop] = useState(true);
  const [scannerStatus, setScannerStatus] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [formData, setFormData] = useState({
    motivo: '',
    destino: '',
    kilometraje_inicial: '',
    fecha_salida: '',
    hora_salida: '',
  });
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [activeReturnRequest, setActiveReturnRequest] = useState(null);
  const [returnForm, setReturnForm] = useState({
    kilometraje_final: '',
    gasolina_restante: '',
    comentarios: '',
    fotos: {
      frente: '',
      lateral: '',
      trasera: '',
    },
  });
  const [userHasActiveVehicle, setUserHasActiveVehicle] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });
  const [returnMessage, setReturnMessage] = useState({ type: '', text: '' });
  const [availabilityMessage, setAvailabilityMessage] = useState({ type: '', text: '' });

  const usuario = localStorage.getItem('usuario');
  const isSubmitBlocked = Boolean(scannedQR)
    && Boolean(formData.fecha_salida && formData.hora_salida)
    && availabilityMessage.type === 'error';

  useEffect(() => {
    setIsDesktop(isDesktopDevice());
  }, []);

  useEffect(() => {
    if (!showForm) {
      stopCamera();
    }
    return () => stopCamera();
  }, [showForm]);

  useEffect(() => {
    refreshActiveVehicleStatus();
  }, []);

  useEffect(() => {
    const fechaSeleccionada = formData.fecha_salida;
    const horaSeleccionada = formData.hora_salida;

    if (!scannedQR || !fechaSeleccionada || !horaSeleccionada) {
      setAvailabilityMessage({ type: '', text: '' });
      return;
    }

    const verificarDisponibilidad = async () => {
      try {
        const token = localStorage.getItem('token');
        const matriculaNormalizada = scannedQR
          ? scannedQR.trim().replace(/^QR[-_\s]*/i, '').replace(/\s+/g, '').toUpperCase()
          : '';

        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/solicitudes/disponibilidad`,
          {
            params: {
              matricula: matriculaNormalizada,
              fecha_salida: `${fechaSeleccionada}T${horaSeleccionada}:00`,
            },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data?.success) {
          const texto = response.data.disponible
            ? `Vehículo disponible para ${fechaSeleccionada} a las ${horaSeleccionada}.`
            : `El vehículo no está disponible para ${fechaSeleccionada} a las ${horaSeleccionada}. ${response.data.message}`;

          setAvailabilityMessage({
            type: response.data.disponible ? 'success' : 'error',
            text: texto,
          });
          return;
        }
      } catch (error) {
        console.error('Error verificando disponibilidad del vehículo:', error);
      }

      setAvailabilityMessage({
        type: 'error',
        text: `No pudimos verificar la disponibilidad del vehículo para ${fechaSeleccionada} a las ${horaSeleccionada}. Intenta nuevamente.`,
      });
    };

    verificarDisponibilidad();
  }, [scannedQR, formData.fecha_salida, formData.hora_salida]);

  useEffect(() => {
    if (!scannedQR) {
      setSelectedVehicle(null);
      return;
    }

    const placaEscaneada = scannedQR.trim();
    const lookupVehicle = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/vehiculos/lookup`,
          { params: { placa: placaEscaneada } }
        );

        if (response.data?.success && response.data?.data) {
          setSelectedVehicle(response.data.data);
          return;
        }
      } catch (error) {
        console.error('Error consultando vehículo:', error);
      }

      setSelectedVehicle({
        placa: placaEscaneada,
        marca: 'Vehículo',
        modelo: 'Modelo no identificado',
      });
    };

    lookupVehicle();
  }, [scannedQR]);

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const video = videoRef.current;
    if (video && video.srcObject) {
      const stream = video.srcObject;
      stream.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    }

    setScannerOpen(false);
  };

  const scanFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const context = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code) {
      const result = code.data.trim();
      if (result) {
        setScannedQR(result);
        setScannerStatus('QR leído correctamente');
        setScannerOpen(false);
        stopCamera();
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setScannerStatus('Este navegador no admite acceso a cámara.');
      return;
    }

    const videoConstraints = [
      { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      { facingMode: { ideal: 'user' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      { width: { ideal: 1280 }, height: { ideal: 720 } },
      true,
    ];

    let lastError = null;

    for (const constraint of videoConstraints) {
      try {
        setScannerStatus('');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: constraint,
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          await videoRef.current.play();
        }

        setScannerOpen(true);
        animationFrameRef.current = requestAnimationFrame(scanFrame);
        return;
      } catch (error) {
        lastError = error;
      }
    }

    setScannerStatus(
      lastError
        ? 'No fue posible acceder a la cámara. Prueba con otra cámara o acepta los permisos del navegador.'
        : 'No fue posible acceder a la cámara. Asegúrate de permitir el uso de la cámara.'
    );
    setScannerOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReturnFieldChange = (e) => {
    const { name, value } = e.target;
    setReturnForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const refreshActiveVehicleStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/solicitudes/mis-solicitudes`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const solicitudes = response.data?.solicitudes || [];
      const activeRequest = (solicitudes || []).find((item) =>
        ['pendiente', 'aprobado', 'en_viaje'].includes(String(item.estado || '').toLowerCase())
      );

      setUserHasActiveVehicle(Boolean(activeRequest));
      setActiveReturnRequest(activeRequest || null);
      return activeRequest || null;
    } catch (error) {
      console.error('Error obteniendo estado del vehículo activo:', error);
      setUserHasActiveVehicle(false);
      setActiveReturnRequest(null);
      return null;
    }
  };

  const openReturnForm = async () => {
    setShowReturnForm(true);
    setReturnMessage({ type: '', text: '' });

    try {
      const activeRequest = await refreshActiveVehicleStatus();
      setReturnForm((prev) => ({
        ...prev,
        kilometraje_final: '',
        gasolina_restante: '',
        comentarios: '',
        fotos: { frente: '', lateral: '', trasera: '' },
      }));

      if (!activeRequest) {
        setReturnMessage({
          type: 'error',
          text: 'No tienes un vehículo activo asignado para devolver.',
        });
      }
    } catch (error) {
      console.error('Error obteniendo solicitud activa para devolución:', error);
      setActiveReturnRequest(null);
      setReturnMessage({
        type: 'error',
        text: 'No se pudo cargar tu vehículo activo para devolución.',
      });
    }
  };

  const handleReturnFileChange = (event, side) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setReturnForm(prev => ({
        ...prev,
        fotos: {
          ...prev.fotos,
          [side]: reader.result,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingReturn(true);
    setReturnMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const matricula = activeReturnRequest?.matricula || scannedQR || '';
      const kilometraje_final = Number(returnForm.kilometraje_final);
      const gasolina_restante = Number(returnForm.gasolina_restante);

      if (!matricula) {
        throw new Error('No hay un vehículo activo para devolver');
      }

      if (!Number.isFinite(kilometraje_final)) {
        throw new Error('El kilometraje final es requerido');
      }

      if (!Number.isFinite(gasolina_restante) || gasolina_restante < 0 || gasolina_restante > 100) {
        throw new Error('La gasolina restante debe estar entre 0 y 100%');
      }

      if (!returnForm.fotos.frente || !returnForm.fotos.lateral || !returnForm.fotos.trasera) {
        throw new Error('Debes cargar las fotos de frente, lateral y trasera del vehículo');
      }

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/solicitudes/devolucion`,
        {
          matricula,
          kilometraje_final,
          gasolina_restante,
          comentarios: returnForm.comentarios,
          fotos: returnForm.fotos,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setReturnMessage({ type: 'success', text: '✅ Devolución registrada correctamente' });
      setUserHasActiveVehicle(false);
      setTimeout(() => {
        setShowReturnForm(false);
        setActiveReturnRequest(null);
        setReturnForm({
          kilometraje_final: '',
          gasolina_restante: '',
          comentarios: '',
          fotos: { frente: '', lateral: '', trasera: '' },
        });
        setReturnMessage({ type: '', text: '' });
        refreshActiveVehicleStatus();
      }, 1500);
    } catch (error) {
      const mensaje = error?.response?.data?.message || error.message || '❌ Error al registrar la devolución';
      setReturnMessage({ type: 'error', text: mensaje });
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const fechaHoraSalida = formData.fecha_salida && formData.hora_salida
        ? `${formData.fecha_salida}T${formData.hora_salida}:00`
        : null;
      const matriculaNormalizada = scannedQR
        ? scannedQR.trim().replace(/^QR[-_\s]*/i, '').replace(/\s+/g, '').toUpperCase()
        : '';

      if (!fechaHoraSalida) {
        throw new Error('La fecha y hora de salida son requeridas');
      }

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/solicitudes/crear`,
        {
          ...formData,
          fecha_salida: fechaHoraSalida,
          matricula: matriculaNormalizada,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setSubmitMessage({ type: 'success', text: '✅ Solicitud creada exitosamente' });
      setUserHasActiveVehicle(true);
      setTimeout(() => {
        setShowForm(false);
        setScannedQR('');
        setFormData({ motivo: '', destino: '', kilometraje_inicial: '', fecha_salida: '', hora_salida: '' });
        setSubmitMessage({ type: '', text: '' });
        refreshActiveVehicleStatus();
      }, 1500);
    } catch (error) {
      const mensaje = error?.response?.data?.message || '❌ Error al crear la solicitud';
      setSubmitMessage({ type: 'error', text: mensaje });
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className={`dashboard-container ${deviceInfo.type}-layout`}>
      <header className="dashboard-header">
        <div className="header-left">
          <button 
            className="menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Abrir menú"
          >
            ☰
          </button>
          <h2>Panel de Control</h2>
          <p>Bienvenido, <span className="user-name">{usuario}</span></p>
        </div>
        <button onClick={handleLogout} className="logout-btn">Cerrar Sesión</button>
      </header>

      {mobileMenuOpen && (
        <nav className="mobile-menu">
          <button className="mobile-menu-item" onClick={() => { closeMobileMenu(); setShowForm(!showForm); }}>
            📋 Nueva Solicitud
          </button>
          <button className="mobile-menu-item" onClick={() => { closeMobileMenu(); navigate('/reportes'); }}>
            📊 Mis Reportes
          </button>
          <button className="mobile-menu-item" onClick={() => { closeMobileMenu(); navigate('/vehiculos'); }}>
            🚗 Vehículos
          </button>
          <button className="mobile-menu-item" onClick={closeMobileMenu}>
            ⚙️ Configuración
          </button>
        </nav>
      )}

      <main className="dashboard-main">
        <div className="welcome-section">
          <h1>Bitácora de Vehículos</h1>
          <p>Selecciona una acción para continuar</p>
        </div>

        <div className="actions-grid">
          <div className="action-card">
            <div className="card-icon">📋</div>
            <div className="card-content">
              <h3>Nueva Solicitud</h3>
              <p>Solicita un vehículo para salida</p>
            </div>
            <button 
              onClick={() => setShowForm(!showForm)}
              className="action-btn"
              disabled={userHasActiveVehicle}
              title={userHasActiveVehicle ? 'Ya tienes un vehículo activo asignado. Debes devolverlo antes de solicitar otro.' : ''}
            >
              {userHasActiveVehicle ? 'Vehículo activo' : showForm ? 'Cancelar' : 'Solicitar'}
            </button>
          </div>

          <div className="action-card">
            <div className="card-icon">🔄</div>
            <div className="card-content">
              <h3>Devolución de Vehículo</h3>
              <p>Reporta el regreso con KM, gasolina y fotos del estado.</p>
            </div>
            <button
              className="action-btn"
              onClick={openReturnForm}
            >
              Registrar Devolución
            </button>
          </div>

          <div className="action-card">
            <div className="card-icon">📊</div>
            <div className="card-content">
              <h3>Mis Reportes</h3>
              <p>Consulta tus reportes</p>
            </div>
            <button className="action-btn" onClick={() => navigate('/reportes')}>
              Ver Reportes
            </button>
          </div>

          <div className="action-card">
            <div className="card-icon">🚗</div>
            <div className="card-content">
              <h3>Vehículos</h3>
              <p>Consulta disponibilidad</p>
            </div>
            <button className="action-btn" onClick={() => navigate('/vehiculos')}>
              Ver Vehículos
            </button>
          </div>

          <div className="action-card">
            <div className="card-icon">⚙️</div>
            <div className="card-content">
              <h3>Configuración</h3>
              <p>Ajusta preferencias</p>
            </div>
            <button className="action-btn">Configurar</button>
          </div>
        </div>

        {showForm && (
          <div className="form-wrapper">
            <div className="form-overlay" onClick={() => setShowForm(false)}></div>
            <div className="form-container animated-in">
              <button className="form-close" onClick={() => setShowForm(false)}>✕</button>
              <h2>Solicitud de Vehículo</h2>

              {submitMessage.text && (
                <div className={`submit-message ${submitMessage.type}`}>
                  {submitMessage.text}
                </div>
              )}

              {availabilityMessage.text && (
                <div className={`availability-message ${availabilityMessage.type}`}>
                  {availabilityMessage.text}
                </div>
              )}

              {userHasActiveVehicle && (
                <div className="availability-message error">
                  Ya tienes un vehículo activo: {activeReturnRequest?.matricula || 'solicitado'}. Debes devolverlo antes de pedir otro.
                </div>
              )}

              <form onSubmit={handleSubmit} className="request-form">
                <div className="form-group">
                  <label htmlFor="matricula">Matrícula (QR)</label>
                  <div className="qr-scanner-wrapper">
                    <input
                      id="matricula"
                      type="text"
                      placeholder="Escanea el QR del vehículo"
                      value={scannedQR}
                      onChange={(e) => setScannedQR(e.target.value)}
                      required
                      className="form-input qr-input"
                    />
                    <button
                      type="button"
                      className="scan-qr-btn"
                      onClick={startCamera}
                    >
                      {scannerOpen ? 'Reiniciar cámara' : 'Escanear QR'}
                    </button>
                  </div>

                  {scannerOpen && (
                    <div className="scanner-panel">
                      <div className="video-shell">
                        <video ref={videoRef} autoPlay playsInline muted className="scanner-video" />
                        <canvas ref={canvasRef} className="scanner-canvas" />
                        <div className="scan-overlay" aria-hidden="true" />
                      </div>
                      <p className="scanner-help">Apunta la cámara al código QR de la placa</p>
                    </div>
                  )}

                  {!scannerOpen && scannerStatus && (
                    <p className={`scanner-status ${scannerStatus === 'QR leído correctamente' ? 'scanner-success' : 'scanner-error'}`}>
                      {scannerStatus}
                    </p>
                  )}

                  {selectedVehicle && (
                    <div className="vehicle-summary-card">
                      <div className="vehicle-summary-icon">🚗</div>
                      <div className="vehicle-summary-info">
                        <span className="vehicle-summary-label">Vehículo detectado</span>
                        <strong>{selectedVehicle.modelo}</strong>
                        <span>{selectedVehicle.placa}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="motivo">Motivo</label>
                    <select
                      id="motivo"
                      name="motivo"
                      value={formData.motivo}
                      onChange={handleFormChange}
                      required
                      className="form-input"
                    >
                      <option value="">Selecciona un motivo</option>
                      <option value="viaje_trabajo">Viaje Trabajo</option>
                      <option value="transporte_carga">Transporte</option>
                      <option value="entrega">Entrega</option>
                      <option value="mantenimiento">Mantenimiento</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="destino">Destino</label>
                    <input
                      id="destino"
                      type="text"
                      placeholder="Destino"
                      name="destino"
                      value={formData.destino}
                      onChange={handleFormChange}
                      required
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-row form-row-three">
                  <div className="form-group">
                    <label htmlFor="km">Kilometraje</label>
                    <input
                      id="km"
                      type="number"
                      placeholder="KM"
                      name="kilometraje_inicial"
                      value={formData.kilometraje_inicial}
                      onChange={handleFormChange}
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="fecha">Fecha de Salida</label>
                    <input
                      id="fecha"
                      type="date"
                      name="fecha_salida"
                      value={formData.fecha_salida}
                      onChange={handleFormChange}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      onFocus={(e) => e.currentTarget.showPicker?.()}
                      required
                      className="form-input date-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="hora_salida">Hora de Salida</label>
                    <input
                      id="hora_salida"
                      type="time"
                      name="hora_salida"
                      value={formData.hora_salida}
                      onChange={handleFormChange}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      onFocus={(e) => e.currentTarget.showPicker?.()}
                      required
                      className="form-input time-input"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isSubmitting || isSubmitBlocked || userHasActiveVehicle}
                  title={userHasActiveVehicle ? 'Ya tienes un vehículo activo asignado. Debes devolverlo antes de solicitar otro.' : isSubmitBlocked ? 'El vehículo no está disponible para la fecha y hora seleccionadas.' : ''}
                >
                  {userHasActiveVehicle ? 'Vehículo activo' : isSubmitting ? 'Enviando...' : isSubmitBlocked ? 'Vehículo no disponible' : 'Enviar Solicitud'}
                </button>
              </form>
            </div>
          </div>
        )}

        {showReturnForm && (
          <div className="form-wrapper">
            <div className="form-overlay" onClick={() => setShowReturnForm(false)}></div>
            <div className="form-container animated-in return-form-container">
              <button className="form-close" onClick={() => setShowReturnForm(false)}>✕</button>
              <h2>Reporte de Devolución</h2>

              {returnMessage.text && (
                <div className={`submit-message ${returnMessage.type}`}>
                  {returnMessage.text}
                </div>
              )}

              <form onSubmit={handleReturnSubmit} className="request-form return-form">
                {activeReturnRequest ? (
                  <div className="pending-return-list">
                    <h3>Vehículo asignado a tu solicitud</h3>
                    <div className="pending-return-item">
                      <strong>{activeReturnRequest.matricula}</strong>
                      <span>Motivo: {activeReturnRequest.motivo || 'No especificado'}</span>
                      <span>Destino: {activeReturnRequest.destino || 'No especificado'}</span>
                      <small>Salida: {new Date(activeReturnRequest.fecha_salida).toLocaleString('es-PE')}</small>
                    </div>
                  </div>
                ) : (
                  <div className="return-assignment-message warning">
                    No tienes un vehículo activo para devolver.
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="km-final">KH/M final</label>
                    <input
                      id="km-final"
                      type="number"
                      name="kilometraje_final"
                      value={returnForm.kilometraje_final}
                      onChange={handleReturnFieldChange}
                      placeholder="Kilometraje"
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="gasolina-restante">Gasolina restante (%)</label>
                    <input
                      id="gasolina-restante"
                      type="number"
                      min="0"
                      max="100"
                      name="gasolina_restante"
                      value={returnForm.gasolina_restante}
                      onChange={handleReturnFieldChange}
                      placeholder="0-100"
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="comentarios">Observaciones</label>
                  <textarea
                    id="comentarios"
                    name="comentarios"
                    value={returnForm.comentarios}
                    onChange={handleReturnFieldChange}
                    rows="4"
                    placeholder="Describe el estado del auto al devolverlo (rayones, daños, notas relevantes)"
                    className="form-input textarea-input"
                  />
                </div>

                <div className="form-group">
                  <label>Fotos del vehículo</label>
                  <div className="photo-upload-grid">
                    {['frente', 'lateral', 'trasera'].map((side) => (
                      <div key={side} className="photo-box">
                        <span>{side === 'frente' ? 'Frente' : side === 'lateral' ? 'Lado' : 'Trasera'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => handleReturnFileChange(event, side)}
                        />
                        {returnForm.fotos[side] && (
                          <img src={returnForm.fotos[side]} alt={`${side} del vehículo`} className="photo-preview" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <button type="submit" className="submit-btn" disabled={isSubmittingReturn || !activeReturnRequest}>
                  {isSubmittingReturn ? 'Guardando devolución...' : activeReturnRequest ? 'Guardar Devolución' : 'Sin vehículo activo'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
