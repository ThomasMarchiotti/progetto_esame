'use strict';

//COPIARE
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

//IMPORT-----------------------------------------------------------------------
const express = require('express');         //importo express
const morgan = require('morgan');           //importo morgan (middleware per il login)
const dao = require('./dao.js');            //Data Access Object
const bcrypt = require('bcrypt');           //importo bCrypt
const path = require('path');
const app = express();                      //istanzio express in app
const port = process.env.port || 3000;      //definisco quale porta utilizzare
const passport = require('passport');       //importo passport
const flash = require('express-flash');
const session = require('express-session');
const sqlite = require('sqlite3');          //importo libreria sqlite

const db = new sqlite.Database('database.db', (err) => {
    if (err) throw err;
});


const initializePassport = require('./passport-config');
updateUserAuth();

function updateUserAuth() {
    const sql = 'SELECT * FROM utenti';
    db.all(sql, (err, users) => {
        if (err) {
            throw (err);
            return;
        }
        initializePassport(
            passport,
            email =>    users.find(user => user.email === email),
            id =>       users.find(user => user.id_utente === id),
        )
    });
}




app.set('view engine', 'ejs');                              //imposto il view engine
app.use(morgan('tiny'));                                    //imposto il middleware
app.use(express.json());                                    //il body di ogni richiesta è di tipo json
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({                                // to support URL-encoded bodies
    extended: true
}));

app.use(flash());
app.use(session({
    secret:             'somevalue',
    resave:             false,
    saveUninitialized:  false
}))
app.use(passport.initialize());
app.use(passport.session());


//route per il login
app.get('/login', checkNotAuthenticated, (req, res) => res.render('login'))

//login
app.post('/login', passport.authenticate('local', {
    successRedirect:    '/',
    failureRedirect:    '/login',
    failureFlash:       true
}))

//logout
app.get('/logout', (req, res) => {
    req.logout()
    dao.getAllSerie()
        .then((serie) =>    res.render('index', { serie, }))
        .catch((error) =>   res.status(404).json(error));
})

//registrazione
app.get('/registrazione', (req, res) => {
    res.render('registrazione')
})


//route generiche
//recuperare tutte le serie di podcast
app.get('/', function(req, res) {
    //GET DELLE SERIE
    dao.getAllSerie()
        .then((serie) =>    res.render('index', { serie }))
        .catch((error) =>   res.status(404).json(error));
})

//selezione della categoria da cercare
app.get('/categoria', function(req, res) {
    //GET DELLE categorie
    dao.getCategorie()
        .then((categorie) =>    res.render('serie-categoria', { categorie }))
        .catch((error) =>       res.status(404).json(error));
})

//recuperare tutte le serie di una categoria
app.get('/categoria/:cat', (req, res) => {
    dao.getSerieByCategoria(req.params.cat)
        .then((cat) =>      res.render('index', { serie: cat }))
        .catch((error) =>   res.status(404).json(error));

})

//recuperare la pagina della serie
app.get('/serie/:idSerie', function(req, res) {

    let data = [];

    data.push(dao.getEpisodiFromSerie(req.params.idSerie));
    data.push(dao.getSerie(req.params.idSerie));

    Promise.all(data) //attende che tutte le promise vengano risolte o rifiutate
        .then(dataArray => {
            let episodi =   dataArray[0] //risultato della prima promise
            let serie =     dataArray[1] //risultato della seconda promise

            res.render('serie', { //renderizza solo avendo entrambi i dati
                episodi:    episodi,
                serie:      serie
            })
        })
        .catch((error) => res.status(404).json(error));
});

//recuperare la pagina dell'episodio
app.get('/episodio/:idEp', checkAuthenticated, function(req, res) {

    let data = [];

    data.push(dao.getEpisodioById(req.params.idEp));
    data.push(dao.getCommentiFromEpisodio(req.params.idEp));
    data.push(dao.getPreferitiByEpisodio(req.params.idEp, req.user.id_utente));
    data.push(dao.getTransazione(req.user.id_utente, req.params.idEp));

    Promise.all(data) //attende che tutte le promise vengano risolte o rifiutate
        .then(dataArray => {
            let episodio =      dataArray[0] //risultato della prima promise
            let commenti =      dataArray[1] //e così via
            let preferiti =     dataArray[2] 
            let transazione =   dataArray[3] 

            res.render('episodio', { //renderizza solo avendo entrambi i dati
                episodi:    episodio,
                recensioni: commenti,
                username:   req.body.name,
                idUtente:   req.user.id_utente,
                preferiti:  preferiti,
                transazione
            })
        })
        .catch((error) => res.status(404).json(error));
});

//recuperare la pagina dello user
app.get('/user', checkAuthenticated, function(req, res) {

    let data = [];

    //le due funzioni async
    data.push(dao.getUserById(req.user.id_utente));
    data.push(dao.getPreferiti(req.user.id_utente));
    data.push(dao.getSerieOfUtente(req.user.id_utente));
    data.push(dao.getCategorie());
    data.push(dao.getEpisodiByUtente(req.user.id_utente));

    Promise.all(data) //attende che tutte le promise vengano risolte o rifiutate
        .then(dataArray => {
            let user =      dataArray[0] //risultato della prima promise
            let preferiti = dataArray[1] //e così via
            let serie =     dataArray[2] 
            let categorie = dataArray[3] 
            let episodi =   dataArray[4]

            res.render('user', { //renderizza con entrambi i dati
                user:       user,
                preferiti:  preferiti,
                serie:      serie,
                categorie,
                episodi:    episodi
            })
        })
        .catch((error) => res.status(404).json(error)); //errore
});




//post method



//registrazione
app.post('/registrazione/post', (req, res) => {

    let psw = bcrypt.hashSync(req.body.password, 10);
    const user = {
        nome:       req.body.username,
        email:      req.body.email,
        password:   psw,
        ruolo:      req.body.ruolo
    };

    dao.creaUser(user)
        .then(() => {
            updateUserAuth();
            res.redirect('/')
        })
        .catch((error) => res.status(503).json({ error: 'errore nella creazione dell utente', user, error }));
});


//aggiungi una nuova serie
app.post('/serie/aggiungi', (req, res) => {
    const serie = {
        titolo:         req.body.titolo,
        descrizione:    req.body.descrizione,
        categoria:      req.body.categoria,
        nome_autore:    req.user.username,
        id_utente:      req.user.id_utente
    };

    dao.creaSerie(serie)
        .then(() => res.redirect('/'))
        .catch((error) => res.status(503).json({ error }));
});

app.post('/serie/rimuovi', (req, res) => {
    const serie = {
        id_serie:   req.body.id_serie,
        id_utente:  req.user.id_utente
    };

    dao.eliminaSerie(serie)
        .then(() =>         res.redirect('/user'))
        .catch((error) =>   res.status(503).json({ error }));
});

//aggiunta episodio
app.post('/episodio/aggiungi', (req, res) => {

    let today = new Date();
    let dd =    String(today.getDate()).padStart(2, '0');
    let mm =    String(today.getMonth() + 1).padStart(2, '0'); //Gennaio è 0
    let yyyy =  today.getFullYear();
    today =     dd + '/' + mm + '/' + yyyy;

    const episodio = {
        titolo:         req.body.titolo,
        descrizione:    req.body.descrizione,
        sponsor:        req.body.sponsor,
        id_serie:       req.body.serie,
        prezzo:         req.body.prezzo,
        date:           today
    };

    dao.creaEpisodio(episodio)
        .then(() =>         res.redirect('/user'))
        .catch((error) =>   res.status(503).json({ error }));
    });

//rimozione episodio
app.post('/episodio/rimuovi', (req, res) => {

    let id_episodio = req.body.id_episodio

    dao.eliminaEpisodio(id_episodio)
        .then(() =>         res.redirect('/user'))
        .catch((error) =>   res.status(503).json({ error }));
});

//aggiunta preferiti
app.post('/preferiti/aggiungi', (req, res) => {

    const preferito = {
        id_utente:      req.user.id_utente,
        id_episodio:    req.body.id_episodio
    };

    dao.aggiungiPreferito(preferito)
        .then(() =>         res.status(201).end())
        .catch((error) =>   res.status(503).json({ error: 'errore nell aggiunta dei preferiti', error }));


});


//rimozione preferiti
app.post('/preferiti/rimuovi', (req, res) => {

    const preferito = {
        id_utente:      req.user.id_utente,
        id_episodio:    req.body.id_episodio
    };

    dao.rimuoviPreferito(preferito)
        .then(() =>         res.status(201).end())
        .catch((error) =>   res.status(503).json({ error: 'errore nella rimozione dei preferiti', error }));


});

//aggiunta transazione
app.post('/transazione/aggiungi', (req, res) => {


    const transazione = {
        id_utente:      req.user.id_utente,
        id_episodio:    req.body.id_episodio
    };


    dao.aggiungiTransazione(transazione)
        .then(() =>         res.redirect('/episodio/' + transazione.id_episodio))
        .catch((error) =>   res.status(503).json({ error }));


});


//aggiungi una recensione
app.post('/recensione/aggiungi', (req, res) => {


    const recensione = {
        id_utente:      req.user.id_utente,
        commento:       req.body.commento,
        id_episodio:    req.body.id_episodio
    };

    dao.aggiungiRecensione(recensione)
        .then(() =>         res.redirect('/episodio/' + recensione.id_episodio))
        .catch((error) =>   res.status(503).json({ error: 'Errore, impossibile aggiungere la recensione, riprova!', error }));


});


//funzione per controllare l'autenticazione
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {

        return next();
    }

    
    res.redirect('/login')
};

//funzione per controllare se non autenticato
function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {

        return res.redirect('/logout');
    }


    next()
};


//avvio il server sulla porta indicata
app.listen(port, () => console.log("Server is listening on port" + port));