const mysql = require('mysql2');
//CONECTAR USUARIO A LA BBDD
const connection = mysql.createConnection({
  host: '144.22.36.128',  
  user: 'sut_user',
  password: 'DB12345__',  
  database: 'proyectosut'
});

connection.connect(err => {
  if (err) {
    console.error('Error conectando a la base de datos: ' + err.stack);
    return;
  }
  console.log('Conectado a la base de datos como ID ' + connection.threadId);
});

module.exports = connection;
