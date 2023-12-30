


const express = require('express');
const session = require('express-session')
const { Basic_account} = require('./server_help.js');


//console.log( sequelize )

const sessionMiddleware = session({
    secret: "changeit",
    resave: true,
    saveUninitialized: true,
    //benchmark: true,
   // standardConformingStrings: true,
    //logging: false,
  });
  


// Constants
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
// App
const app = express();


app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.set('view engine', 'ejs');


app.use(sessionMiddleware);

//a = new Basic_account("a", "b", "ab", "ab12", 'ab@gmail.com')



app.get("/", (req, res, next) => {
  if ( req.session.valid ){ 
    res.render("center",{username: req.session.username})
  } else {
    res.render("home",{message: ""})
  }
  next()
})

app.post("/signup", async (req, res, next) => {
  let {fname,lname, username, password, email, keycard} = req.body

console.log(
  {fname,lname, username, password, email, keycard}
)
  let a = new Basic_account(fname,lname, username, password, email, keycard)

  let msg = await a.message

if( req.body.type == "json"){

    res.json({"valid": msg.good, "message": msg.message })
  
}else {

 if( msg.good ) {
    req.session.valid = true
    req.session.username = username

    res.render("center",{username})

    next()
  } else {
    res.render("home", {message: msg.message})
    next()
  }

}

})

app.post("/login", async (req, res, next) => {
    let { username, password} = req.body

    let a = new Basic_account(null, null, username, password)

    let msg = await a.message



 if( msg.good ) {
    req.session.valid = true
    req.session.username = username

    res.render("center",{username})

    next()
  } else {
    res.render("home", {message: msg.message})
    next()
  }


})



app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);

