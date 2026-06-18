require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
});

// Test de conexión al MySQL
db.connect((err) => {
    if (err) {
        console.error('Error conectando a MySQL:', err);
        return;
    }
    console.log('Conexión exitosa a la base de datos de La Número 1');
});

app.get('/', function(req, res) {
  res.send('¡Backend de La Número 1 funcionando con éxito!');
});

app.get('/sedes', function(req, res) {
    // Traemos solo lo necesario para el select
    const sql = "SELECT id_ubicacion, cod_ubi, lugar FROM ubicacion WHERE estado = 1 AND lugar IS NOT NULL ORDER BY id_ubicacion ASC";
    db.query(sql, (err, result) => {
        if (err){
            return res.status(500).json({ error: err.message });
        }
        res.json(result);
    });
});

app.get('/sedes/:id', function(req, res) {
    const id = req.params.id; // Extraemos el ID de la URL
    const sql = "SELECT * FROM ubicacion WHERE id_ubicacion = ?";
    
    // Usamos el signo '?' para prevenir Inyección SQL (Seguridad Zero Trust)
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (result.length === 0) {
            return res.status(404).send("Sede no encontrada.");
        }
        
        return res.json(result[0]); // Devolvemos solo el objeto de la sede encontrada
    });
});

app.get('/obtener-coordenadas', function(req, res) {
    // El parámetro llega desde el fetch del frontend, aunque por ahora traemos todo y Vue filtra el centro
    const sedeUsuario = req.query.sede; 

    const query = `
        SELECT 
            s.latitud, 
            s.longitud, 
            s.lugar,
            s.cod_ubi,
            AVG(m.velocidad_bajada_mbps) AS velocidad,
            m.id_provincia
        FROM ubicacion s
        LEFT JOIN monitoreo_conexion m ON m.id_provincia = s.id_ubicacion
        WHERE s.latitud IS NOT NULL AND s.longitud IS NOT NULL
        GROUP BY s.latitud, s.longitud, s.lugar, s.cod_ubi, m.id_provincia
    `;

    db.query(query, (err, rows) => {
        if (err) {
            console.error("Error al obtener coordenadas:", err);
            return res.status(500).json({ error: "Error en la base de datos" });
        }

        if (rows.length === 0) {
            console.log("La consulta se ejecutó, pero no trajo ningún registro amarrado con LIKE.");
        }

        res.json(rows);
    });
});

app.post('/registrar-test', function(req,res){
    console.log("Llegaron los datos:", req.body);

    const { id_provincia, nom_usuario, velocidad_bajada_mbps, ping_ms, nivel_conexion, fecha_test } = req.body;

    const sql = `INSERT INTO monitoreo_conexion 
                 (id_provincia, nom_usuario, velocidad_bajada_mbps, ping_ms, nivel_conexion, fecha_hora) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [id_provincia, nom_usuario, velocidad_bajada_mbps, ping_ms, nivel_conexion, fecha_test];
    db.query(sql, values, function(err, result){
        if (err) {
            console.error("Error al grabar registro:", err);
            return res.status(500).json({ error: "Error al guardar los datos" });
        }
        
        res.status(201).json({ 
            message: "Registro guardado exitosamente.", 
            id: result.insertId 
        });
    })
})

app.get('/resultados', function(req, res) {
    const query = `
        SELECT 
            m.id_monitoreo,
            m.nom_usuario, 
            m.velocidad_bajada_mbps, 
            m.ping_ms, 
            m.nivel_conexion,
            m.fecha_hora,
            CONCAT(u.cod_ubi, ' - ', u.lugar) as sede
        FROM monitoreo_conexion m
        LEFT JOIN ubicacion u ON m.id_provincia = u.id_ubicacion
        ORDER BY m.fecha_hora DESC, m.id_monitoreo DESC
    `;
    db.query(query, (err, rows) => {
        if (err) {
            console.error("Error al obtener resultados:", err);
            return res.status(500).json({ error: "Error en la base de datos" });
        }
        res.json(rows);
    });
});

if (require.main === module) {
    app.listen(port, '0.0.0.0', () => {
        console.log(`Servidor de InternetTest corriendo en el puerto ${port}`);
    });
}

module.exports = app;