import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Vehicles() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/vehiculos/disponibles`);
        if (response.data?.success) {
          setVehicles(response.data.data || []);
        } else {
          setError('No se pudieron cargar los vehículos disponibles.');
        }
      } catch (err) {
        setError('No fue posible consultar los vehículos disponibles.');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  return (
    <div className="vehicles-page">
      <div className="vehicles-shell">
        <div className="vehicles-header">
          <div>
            <p className="vehicles-kicker">Disponible</p>
            <h1>Vehículos Disponibles</h1>
          </div>
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            Volver
          </button>
        </div>

        {loading && <div className="vehicles-state">Cargando vehículos...</div>}

        {!loading && error && <div className="vehicles-state error">{error}</div>}

        {!loading && !error && vehicles.length === 0 && (
          <div className="vehicles-state">No hay vehículos disponibles en este momento.</div>
        )}

        {!loading && !error && vehicles.length > 0 && (
          <div className="vehicles-grid">
            {vehicles.map((vehicle) => (
              <div className="vehicle-card" key={vehicle.placa}>
                <div className="vehicle-badge">🚗</div>
                <div className="vehicle-info">
                  <span className="vehicle-label">Modelo</span>
                  <strong>{vehicle.modelo}</strong>
                  <span className="vehicle-meta">Marca: {vehicle.marca}</span>
                  <span className="vehicle-meta">Placa: {vehicle.placa}</span>
                  <span className="vehicle-meta">Color: {vehicle.color}</span>
                  <span className="vehicle-meta">Año: {vehicle.anio}</span>
                  <span className={`vehicle-status status-${String(vehicle.estado || 'disponible').toLowerCase()}`}>
                    {vehicle.estado || 'disponible'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
