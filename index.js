const { json } = require('body-parser');
const express = require('express');
const ObjectId = require('mongodb').ObjectId;
const { MongoClient } = require('mongodb');
const cors = require('cors');
const app = express();
app.use(cors());
const PORT = process.env.PORT || 4000;
const MONGO_URL = 'mongodb+srv://UTP:utp2024@clusterutp.yfa2pk5.mongodb.net';
const DATABASE_NAME = 'utp';
const EQUIPOS = 'equipos';
const SOLICITUDES = 'solicitudes';
const USUARIOS = 'usuarios';
let db;
// Middleware para parsear JSON                        
app.use(express.json());

// Conexión a la base de datos                              
MongoClient.connect(MONGO_URL)
    .then(client => {
        db = client.db(DATABASE_NAME);
        console.log('Conectado a MongoDB Base de datos utp');
    })
    .catch(err => {
        console.error('Error al conectar a MongoDB', err);
    });

// Obtener los equipos registrados                              
app.get('/equipos', async (req, res) => {
    let resu = await db.collection(EQUIPOS).find({}).toArray();
    console.log("Consultar todos los equipos registrados");
    res.status(200).json(resu);
});

//APi para obtener todos los usuarios
app.get('/usuarios', async (req, res) => {
    let resu = await db.collection(USUARIOS).find({}).toArray();
    console.log("Consultar todos los usuarios registrados");
    res.status(200).json(resu);
});

// Ruta para obtener el correo de un usuario por su ID
app.get('/usuarios/:id', async (req, res) => {
    const userId = req.params.id; // Obtenemos el parámetro ID de la solicitud

    try {
        // Buscamos en la colección de usuarios en MongoDB el usuario con el ID proporcionado
        const usuario = await db.collection(USUARIOS).findOne({ _id: new ObjectId(userId) });

        // Si no encontramos al usuario, respondemos con un código de estado 404 (No encontrado)
        if (!usuario) {
            return res.status(404).send('Usuario no encontrado');
        }

        // Si encontramos al usuario, respondemos con su correo en formato JSON y código de estado 200 (OK)
        res.status(200).json({ correo: usuario.correo });
    } catch (err) {
        // En caso de error, registramos el error en la consola y respondemos con un código de estado 500 (Error del servidor)
        console.error(err);
        res.status(500).send('Error al obtener usuario');
    }
});

// Crear nuevo usuario                                
app.post('/usuarios', async (req, res) => {
    const { rol, correo, nombre } = req.body;
    if (!correo || !nombre || !rol) {
        return res.status(500).send('Todos los campos son requeridos.');
    } else {
        const nuevoRegistro = req.body;
        const usuario = await db.collection(USUARIOS).findOne({ correo: correo });
        if (!usuario) {
            try {
                await db.collection(USUARIOS).insertOne(nuevoRegistro);
                res.status(200).send("Nuevo usuario creado!");
            } catch (err) {
                console.log(err);
                res.status(500).send('Error al crear usuario');
            }
        } else {
            return res.status(500).send('Usuario existente');
        }
    }
});

// Modificar información de usuario existente
app.post('/usuarios/:correo', async (req, res) => {
    const { rol, nombre } = req.body;
    const correo = req.params.correo;

    if (!correo || !nombre || !rol) {
        return res.status(500).send('Todos los campos son requeridos.');
    } else {
        const nuevoRegistro = { rol, nombre };  // No incluir el correo en el nuevo registro
        const usuario = await db.collection(USUARIOS).findOne({ correo: correo });

        if (!usuario) {
            // Si no existe el usuario, devolver un error
            return res.status(404).send('Usuario no encontrado');
        }

        try {
            // Actualizar el usuario existente con los nuevos datos
            await db.collection(USUARIOS).updateOne({ correo: correo }, { $set: nuevoRegistro });
            res.status(200).send("Información de usuario actualizada!");
        } catch (err) {
            console.log(err);
            res.status(500).send('Error al actualizar usuario');
        }
    }
});

// Borrar usuario por correo electrónico
app.delete('/usuarios/:correo', async (req, res) => {
    const correo = req.params.correo;

    try {
        // Buscar el usuario por correo electrónico
        const usuario = await db.collection(USUARIOS).findOne({ correo: correo });

        if (!usuario) {
            return res.status(404).send('Usuario no encontrado');
        }

        // Si el usuario existe, proceder con la eliminación
        await db.collection(USUARIOS).deleteOne({ correo: correo });
        res.status(200).send("Usuario eliminado correctamente");
    } catch (err) {
        console.log(err);
        res.status(500).send('Error al intentar eliminar usuario');
    }
});


// Obtener los equipos de acuerdo a su estado                              
app.get('/equipos/:estado', async (req, res) => {
    const est = req.params.estado;
    const equipos = await db.collection(EQUIPOS).find({ estado: est }).toArray();
    console.log(equipos);
    res.status(200).send(equipos);
});

// Crear nuevo equipo para prestamos                                
app.post('/equipos', async (req, res) => {
    const { marbete, descripcion } = req.body;
    if (!marbete || !descripcion) {
        return res.status(500).send('Todos los campos son requeridos.{marbete, descripcion}');
    }
    const nuevoRegistro = { ...req.body, estado: 'DISPONIBLE' };
    try {
        await db.collection(EQUIPOS).insertOne(nuevoRegistro);
        res.status(200).send(JSON.stringify({ msg: "Nuevo equipo creado con marbete: " + marbete + "!", status: 200 }));
    } catch (err) {
        console.log(err);
        res.status(500).send('Error al crear equipo');
    }
});

// Modificar la descripción de un equipo solo si su estado es DISPONIBLE
app.put('/equipos/:id', async (req, res) => {
    const equipoID = req.params.id;
    const { descripcion } = req.body;

    if (!descripcion) {
        return res.status(400).send('La descripción es requerida');
    }

    let filtro;

    try {
        filtro = { _id: new ObjectId(equipoID) };
    } catch (err) {
        return res.status(500).send('Id en formato incorrecto');
    }

    try {
        // Buscar el equipo por ID
        const equipo = await db.collection(EQUIPOS).findOne(filtro);

        if (!equipo) {
            return res.status(404).send('Equipo no encontrado');
        }

        // Verificar si el estado es DISPONIBLE
        if (equipo.estado !== 'DISPONIBLE') {
            return res.status(400).send('El equipo no está disponible para modificar');
        }

        // Actualizar la descripción del equipo
        const documentoActualizado = { $set: { descripcion: descripcion } };
        await db.collection(EQUIPOS).updateOne(filtro, documentoActualizado);
        res.status(200).send(`Descripción del equipo con ID ${equipoID} actualizada correctamente`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al actualizar la descripción del equipo');
    }
});

// Aprobar, rechazar o establecer solicitudes como pendientes                              
app.post('/solicitudes/:id', async (req, res) => {
    const { marbete, estado, encargado } = req.body;
    const solicitudID = req.params.id;
    let filtro;
    try {
        filtro = { _id: new ObjectId(solicitudID) };
    } catch {
        return res.status(500).send('Id en formato incorrecto');
    }
    if (!estado || !marbete || !encargado) {
        return res.status(500).send('Campos requeridos: [marbete, encargado, estado]');
    }
    const documentoActualizado = { $set: { estado: estado, encargado: encargado } };
    const result = await db.collection(SOLICITUDES).updateOne(filtro, documentoActualizado, { upsert: false });
    await actualizarEstadoSolicitud({ marbete: marbete }, estado);
    res.status(200).json(result);
});

// Obtener solicitudes de un usuario específico o todas                            
app.get('/solicitudes', async (req, res) => {
    const { correo, estado } = req.body;
    if (estado == undefined && correo == undefined) {
        const resultado = await db.collection(SOLICITUDES).find({}).toArray();
        res.status(200).send(resultado);
    } else if (correo && !estado) {
        const resultado = await db.collection(SOLICITUDES).find({ correo: correo }).toArray();
        res.status(200).send(resultado);
    } else {
        res.status(500).json({ msg: 'error' });
    }
});

// Eliminar un equipo solo si su estado es DISPONIBLE
app.delete('/equipos/remove/:id', async (req, res) => {
    const equipoID = req.params.id;
    let filtro;

    try {
        filtro = { _id: new ObjectId(equipoID) };
    } catch (err) {
        return res.status(500).send('Id en formato incorrecto');
    }

    try {
        // Buscar el equipo por ID
        const equipo = await db.collection(EQUIPOS).findOne(filtro);

        if (!equipo) {
            return res.status(404).send('Equipo no encontrado');
        }

        // Verificar si el estado es DISPONIBLE
        
        if (equipo.estado !== 'DISPONIBLE') {
            return res.status(400).send('El equipo no está disponible para eliminar');
        }

        // Eliminar el equipo
        await db.collection(EQUIPOS).deleteOne(filtro);
        res.status(200).send(`Equipo con ID ${equipoID} eliminado correctamente`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al eliminar el equipo');
    }
});

// Crear nueva solicitud                                
app.post('/solicitudes', async (req, res) => {
    const { correo, equipo, marbete } = req.body;
    if (!correo || !equipo || !marbete) {
        return res.status(500).send('Campos requeridos.[correo, equipo, marbete]');
    }
    const nuevoRegistro = { ...req.body, estado: 'PENDIENTE', encargado: '' };
    await db.collection(SOLICITUDES).insertOne(nuevoRegistro);
    let result = await db.collection(EQUIPOS).updateOne({ marbete: marbete }, { $set: { estado: 'SOLICITADO' } }, { upsert: false });
    res.status(200).json({ msg: "Ok" });
});
async function actualizarEstadoSolicitud(filtro, estado) {
    let result;
    switch (estado.toUpperCase()) {
        case 'PENDIENTE':
            result = await db.collection(EQUIPOS).updateOne(filtro, { $set: { estado: 'SOLICITADO' } });
            break;
        case 'APROBADO':
            result = await db.collection(EQUIPOS).updateOne(filtro, { $set: { estado: 'ENUSO' } });
            break;
        case 'NO_APROBADO':
            result = await db.collection(EQUIPOS).updateOne(filtro, { $set: { estado: 'DISPONIBLE' } });
            break;
        case 'RETORNADO':
            result = await db.collection(EQUIPOS).updateOne(filtro, { $set: { estado: 'DISPONIBLE' } });
            break;
        default:
            result = await db.collection(EQUIPOS).updateOne(filtro, { $set: { estado: 'SOLICITADO' } });
            break;
    }
    return result;
}

// Iniciar el servidor                              
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});