require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

// Conexión al database del MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
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
    const sql = "SELECT cod_ubi, lugar FROM sedes WHERE estado = 1 AND lugar IS NOT NULL ORDER BY id_ubicacion ASC";
    db.query(sql, (err, result) => {
        if (err){
            return res.status(500).json({ error: err.message });
        }
        res.json(result);
    });
});

app.get('/sedes/:id', function(req, res) {
    const id = req.params.id; // Extraemos el ID de la URL
    const sql = "SELECT * FROM sedes WHERE id_ubicacion = ?";
    
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
            r.velocidad,
            r.base
        FROM sedes s
        LEFT JOIN registroInternet r ON r.base LIKE CONCAT('%', s.lugar, '%')
        WHERE s.latitud IS NOT NULL AND s.longitud IS NOT NULL
    `;

    db.query(query, (err, rows) => {
        if (err) {
            console.error("Error al obtener coordenadas:", err);
            return res.status(500).json({ error: "Error en la base de datos" });
        }

        if (rows.length === 0) {
            console.log("⚠️ La consulta se ejecutó, pero no trajo ningún registro amarrado con LIKE.");
        }

        res.json(rows);
    });
});

app.post('/registrar-test', function(req,res){
    console.log("Llegaron los datos:", req.body);

    const { usuario, base, velocidad, ping, nivelConexion } = req.body;

    const sql = `INSERT INTO registroInternet 
                 (usuario, base, velocidad, ping, nivelConexion) 
                 VALUES (?, ?, ?, ?, ?)`;
    const values = [usuario, base, velocidad, ping, nivelConexion];
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

app.listen(port, () => {
  console.log(`Servidor de InternetTest corriendo en el puerto ${port}`);
});