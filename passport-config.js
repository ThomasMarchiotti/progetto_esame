const localStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')

function initialize(passport, getUserByEmail, getUserById) {
    authenticateUser = async(email, password, done) => {
        const user = getUserByEmail(email)
        if (user == null) {
            return done(null, false, { message: 'Nessun utente con questa email' })
        }

        try {
            if (await bcrypt.compare(password, user.password)) {
                return done(null, user)
            } else {
                return done(null, false, { message: 'Passowrd non corretta' })
            }
        } catch (error) {
            return done(e)
        }
    }

    passport.use(new localStrategy({ usernameField: 'email' }, authenticateUser))

    passport.serializeUser((user, done) => { done(null, user.id_utente) })
    passport.deserializeUser((id, done) => { return done(null, getUserById(id)) })
}

module.exports = initialize