//require('dotenv').config({ path: './w3s-dynamic-storage/.env' });

const path = require('path');

const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require("bcrypt")


//const DATABASE_PATH = process.env.SQLITE_PATH || path.join(__dirname, 'w3s-dynamic-storage', '.env');


const salt = "$2b$10$b63K/D03WFBktWy552L5XuibmiD5SxCrKg9kHCqOYaZwxRjIg14u2"//process.env.SALT 


const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: "user.db"//DATABASE_PATH
});




const User = sequelize.define("user", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  type: {
    type: DataTypes.TEXT,
    isNull: false,
    set: function (type) {
      if (type == "Basic" || type == "Admin") {
        this.setDataValue("type", type)
      } else {
        TypeError(`The type: ${type} is not valid.`)
      }
    }
  },

  firstName: DataTypes.TEXT,
  lastName: DataTypes.TEXT,

  username: {
    type: DataTypes.TEXT,
    unique: true
  },

  password: {
    type: DataTypes.TEXT,
    allowNull: false,

    set: function (password) {
      let hash = bcrypt.hashSync(password, salt);

      this.setDataValue('password', hash)
    }


  },

  email: {
    type: DataTypes.TEXT,
    unique: true,
    isEmail: true
  },

  keycard: {
    type: DataTypes.TEXT,
    unique: true,
    allowNull: true
  },

}, { paranoid: true });



class Basic_account {
  constructor(firstName = null, lastName = null, username, password, email = null, keycard = null, type = "Basic") {

    this.username = username;
    this.password = password;

    this.firstName = firstName;
    this.lastName = lastName;

    this.email = email;

    this.type = type;

    this.keycard = keycard;

    if( firstName == null && lastName == null && email == null ){
      this.message = this.message_getter("login")
    }else{
      this.message = this.message_getter("signup")
    }



  }

  message_getter(type = "signup") {
    let obj = this
    if( type == "signup" ){
    return new Promise(resolve => {
      obj.validateLogin().then(x => {
        if (x) {
          obj.isDeleted().then(x => {
            if (x) {
              resolve({ message: "This account is deleted", good: false })
            } else {
              resolve({ message: "This account already exsists", good: false })
            }
          })
        } else {
          obj.create().then(x => x === null ? resolve({ message: "This account already exsists", good: false }) : resolve({ message: "This account was created successfully", good: true }))
        }

      })
    })
    }else if( type == "login"){
       return new Promise(async resolve => {
        
      let a = await obj.meAccount()

      if(a == null) return;

      let {firstName, lastName, email, password} = a;


      obj.firstName = firstName
      obj.lastName = lastName
      obj.email = email


      if( !(await obj.validateLogin() ) ) resolve({message: "invalid", good: false})



       resolve({ message: "This account was logged in successfully", good: true })

       })
    }
  }

    /**
     * create a new account
     * @returns the new sql object
     */
  async create() {

    if ((await this.getAccount())) return null;
    return await User.create({
      firstName: this.firstName,
      lastName: this.lastName,

      email: this.email,
      password: this.password,
      username: this.username,
      keycard: this.keycard,

      type: this.type
    })
  }

    /**
  * Gets a user by all values except password
  * @returns {Bool} true if an account exists
  */
  async getAccount() {
    let account = await User.findOne({
      where: {
        username: this.username,
        type: this.type
      }
    })

    return account != null
  }


    /**
     * validates username and password
     * @returns true if the username and password match an account
     */
  async validateLogin() {
    if (!(await this.getAccount())) return false;

    let account = await User.findOne({ where: { username: this.username } })

    return bcrypt.compareSync(this.password, account.password)
  }

  async meAccount() {
    if (!(this.getAccount()) || !(this.validateLogin())) return false;
    return await User.findOne({
      where: { username: this.username,  type: this.type
      }
    }, { raw: false, })
  }

  async changeFirstName(new_thing) {
    let old = this.firstName
    if ((await this.getAccount())) return false;
    this.firstName = new_thing
    if ((await this.getAccount())) return false;

    this.message = { message: "This account has changed First name", good: true };
    return await User.update({ firstName: new_thing }, {
      where: {
        username: this.username,
        firstName: old,
      }
    });
  }

  async changeLastName(new_thing) {
    let old = this.lastName
    if ((await this.getAccount())) return false;
    this.lastName = new_thing
    if ((await this.getAccount())) return false;

    this.message = { message: "This account has changed Last name", good: true };

    return await User.update({ lastName: new_thing }, {
      where: {
        username: this.username,
        lastName: old,
      }
    });
  }

  async changeUsername(new_thing) {
    let old = this.username
    if ((await this.getAccount())) return false;
    this.username = new_thing
    if ((await this.getAccount())) return false;

    this.message = { message: "This account has changed Username name", good: true };

    return await User.update({ username: new_thing }, {
      where: {
        username: old
      }
    });
  }


  async deleteAccount() {
    if (!(await this.validateLogin())) return false;

    this.message = { message: "This account has been deleted", good: true };
    return await User.destroy({
      where: {
        firstName: this.firstName,
        lastName: this.lastName,

        username: this.username,

        type: this.type
      }
    })

  }

  async isDeleted() {
    return (await this.meAccount()).deletedAt !== null
  }

}



(async () => {
  await sequelize.sync({ force: false });

  // let {fname,lname, username, password, email} = {fname:"a",lname:'a', username:'a', password:"a", email:"a@a.com"}
  // let a = new Basic_account(fname,lname, username, password, email)


  //    console.log( a )


  //a.deleteAccount().then(console.log)

  //a.changeFirstName("a").then(console.log)

  //console.log( a )
  // Code here
})();


module.exports = { Basic_account}

