-- tabla de roles
CREATE TABLE rol (
    id       SERIAL PRIMARY KEY,
    name_rol VARCHAR(500) NOT NULL
);

-- tabla de usuarios
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    id_rol        INT NOT NULL REFERENCES rol(id),
    name          VARCHAR(500) NOT NULL,
    last_name     VARCHAR(500) NOT NULL,
    user_name     VARCHAR(500) NOT NULL UNIQUE,
    password_hash VARCHAR(500) NOT NULL
);

-- tabla de carros
CREATE TABLE cars (
    id            SERIAL PRIMARY KEY,
    brand         VARCHAR(500),
    model         VARCHAR(500),
    year          INT,
    license_plate VARCHAR(500) UNIQUE,
    qr_code       VARCHAR(500),
    image_url     VARCHAR(500)
);

-- tabla de solicitud de salida de los carros
CREATE TABLE exit_request (
    id            SERIAL PRIMARY KEY,
    id_user       INT NOT NULL REFERENCES users(id),
    id_car        INT NOT NULL REFERENCES cars(id),
    reason        VARCHAR(500),
    destiny       VARCHAR(500),
    start_mileage REAL,
    start_date    DATE,
    end_date      DATE,
    create_date   DATE DEFAULT CURRENT_DATE
);

-- tabla de solicitud de entrada de los carros
CREATE TABLE entrance_request (
    id              SERIAL PRIMARY KEY,
    id_user         INT NOT NULL REFERENCES users(id),
    id_exit_request INT NOT NULL REFERENCES exit_request(id),
    comment         VARCHAR(500),
    oil             REAL,
    end_mileage     REAL,
    front_image     VARCHAR(500),
    side_image      VARCHAR(500),
    back_image      VARCHAR(500)
);

-- disponibilidad de carros y a qué departamento (rol) pertenece cada uno
CREATE TABLE cars_status (
    id     SERIAL PRIMARY KEY,
    id_car INT NOT NULL REFERENCES cars(id),
    id_rol INT NOT NULL REFERENCES rol(id),
    status VARCHAR(500),
    UNIQUE (id_car, id_rol)
);
