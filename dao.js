'use strict';

//DAO data access object per accedere ai dati

//importo il modulo sqlite
const squlite = require('sqlite3');

//crea il db podcast
const db = new squlite.Database('database.db', (err) => {
    if (err) throw err; //errore nell'apertura
});

//

//GET METHOD

//


//get di tutte le categorie
exports.getCategorie = function() {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT DISTINCT(categoria) FROM serie';
        db.all(sql, (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows);
        });
    });
};

//get di  tutte le serie
exports.getAllSerie = function() {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM serie';
        db.all(sql, (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows);
        });
    });
};

//get di tutte le serie dal titolo
exports.getSerieByCategoria = function(cat) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM serie WHERE categoria= ?';
        db.all(sql, [cat], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            if (rows == undefined) {
                resolve({ error: 'categoria non trovata' });
            } else {
                resolve(rows);
            }
        });
    });
};

//get della singola serie
exports.getSerie = function(id) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM serie WHERE id_serie=?';
        db.get(sql, [id], (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(row);
        });
    });
};

//get di tutti gli epsiodi dall'id della serie
exports.getEpisodiFromSerie = function(id) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM episodi WHERE id_serie=?';
        db.all(sql, [id], (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(row);
        });
    });
};

//get di un episodio
exports.getEpisodioById = function(id) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM episodi WHERE id_episodio=?';
        db.get(sql, [id], (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(row);
        });
    });
};

//get degli epsiodi dall'id dell'utente
exports.getEpisodiByUtente = function(id) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT episodi.titolo,episodi.id_episodio FROM episodi JOIN serie ON episodi.id_serie=serie.id_serie JOIN utenti ON serie.id_utente=utenti.id_utente WHERE utenti.id_utente=?';
        db.all(sql, [id], (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(row);
        });
    });
};

//get dei commenti dall'id dell'episodio
exports.getCommentiFromEpisodio = function(id) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM recensioni WHERE id_episodio=?';
        db.all(sql, [id], (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(row);
        });
    });
};

//get di tutti gli utenti
exports.getUsers = function() {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM utenti';
        db.all(sql, (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(row);
        });
    });
};


//get dell'utente dall'ID
exports.getUserById = function(id) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM utenti WHERE id_utente=?';
        db.get(sql, [id], (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(row);
        });
    });
};

//get del titolo degli epsiodi piaciuti da un utente
exports.getPreferiti = function(id) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT episodi.titolo FROM episodi JOIN preferiti ON episodi.id_episodio=preferiti.id_episodio WHERE preferiti.id_utente=?';
        db.all(sql, [id], (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(row);
        });
    });
};

//get del titolo degli epsiodi piaciuti da un utente
exports.getPreferitiByEpisodio = function(id_episodio, id_utente) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT id_episodio FROM preferiti WHERE id_episodio=? AND id_utente = ?';
        db.get(sql, [id_episodio, id_utente], (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(row);
        });
    });
};

//get episodio pagato
exports.getTransazione = function(id_utente, id_episodio) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT COUNT(*) as contatore_transazione FROM transazioni WHERE id_utente=? AND id_episodio = ?';
        db.get(sql, [id_utente, id_episodio], (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(row);
        });
    });
};




//

//POST METHOD

//


//aggiunge un nuovo utente al db
exports.creaUser = function(user) {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO utenti(email, password, ruolo, username) VALUES(?, ?, ?, ?)';
        db.run(sql, [user.email, user.password, user.ruolo, user.nome], (err) => {
            if (err)
                reject(err);
            else
                resolve(this.lastID);
        });
    });
};

//recupera le serie create da un utente
exports.getSerieOfUtente = function(id) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM serie WHERE id_utente=?';
        db.all(sql, [id], (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(row);
        });
    });
};


//aggiunge una serie nuova al db
exports.creaSerie = function(serie) {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO serie(titolo, descrizione, categoria, nome_autore, id_utente) VALUES(?, ?, ?, ?, ?)';
        db.run(sql, [serie.titolo, serie.descrizione, serie.categoria, serie.nome_autore, serie.id_utente], (err) => {
            if (err)
                reject(err);
            else
                resolve(this.lastID);
        });
    });
};

//elimina una serie dal db
exports.eliminaSerie = function(serie) {
    return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM serie WHERE id_utente=? AND id_serie=?';
        db.run(sql, [serie.id_utente, serie.id_serie], (err) => {
            if (err)
                reject(err);
            else
                resolve(this.lastID);
        });
    });
};

//aggiunge una serie nuova al db
exports.creaEpisodio = function(episodio) {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO episodi(titolo, descrizione, data, sponsor, id_serie, prezzo) VALUES(?, ?, ?, ?, ?, ?)';
        db.run(sql, [episodio.titolo, episodio.descrizione, episodio.date, episodio.sponsor, episodio.id_serie, episodio.prezzo], (err) => {
            if (err)
                reject(err);
            else
                resolve(this.lastID);
        });
    });
};

//elimina una serie dal db
exports.eliminaEpisodio = function(id_episodio) {
    return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM episodi WHERE id_episodio=?';
        db.run(sql, [id_episodio], (err) => {
            if (err)
                reject(err);
            else
                resolve(this.lastID);
        });
    });
};

//aggiunge un episodio ai preferiti
exports.aggiungiPreferito = function(preferito) {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO preferiti(id_utente, id_episodio) VALUES(?, ?)';
        db.run(sql, [preferito.id_utente, preferito.id_episodio], (err) => {
            if (err)
                reject(err);
            else
                resolve(this.lastID);
        });
    });
};

//rimuove un episodio dai preferiti
exports.rimuoviPreferito = function(preferito) {
    return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM preferiti WHERE id_utente=? AND id_episodio=? ';
        db.run(sql, [preferito.id_utente, preferito.id_episodio], (err) => {
            if (err)
                reject(err);
            else
                resolve(this.lastID);
        });
    });
};

//aggiunge una transazione alla tabella transazioni
exports.aggiungiTransazione = function(transazione) {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO transazioni (id_episodio, id_utente) VALUES(?, ?)';
        db.run(sql, [transazione.id_episodio, transazione.id_utente], (err) => {
            if (err)
                reject(err);
            else
                resolve(this.lastID);
        });
    });
};

//aggiunge una recensione ad un episodio
exports.aggiungiRecensione = function(recensione) {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO recensioni (id_utente, commento, id_episodio) VALUES(?, ?, ?)';
        db.run(sql, [recensione.id_utente, recensione.commento, recensione.id_episodio], (err) => {
            if (err)
                reject(err);
            else
                resolve(this.lastID);
        });
    });
};