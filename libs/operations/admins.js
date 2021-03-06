// *Requiring the needed modules:
const uuid = require('uuid');
const cry = require('../tools/cry');
const KunlunError = require('../errors/kunlun');
const conns = require('../repository/connections');
const { COLLECTIONS } = require('../repository/model/meta');
const { KUNLUN_ERR_CODES } = require('../errors/codes');



/**
 * Builds the admins operations
 * @param  {Kunlun} kunlun   The Kunlun module instance
 * @param  {Object} settings The settings to configure the admins operations
 * @return {Object}          The available operations object
 */
module.exports = (kunlun, settings) => {
   // *Getting the collections models:
   const Admin = conns.get(conns.NAMES.READ_WRITE).model(COLLECTIONS.ADMIN);



   /**
    * Checks if the given admin credentials matches
    * @param  {String} username The admin username
    * @param  {String} password The admin password
    * @return {Promise}         Resolves into the admin object if the credentials matches, or it rejects
    */
   function check(username, password){
      // *Searching for an admin that matches with the given username:
      return Admin
         .findOne({ username })
         .exec()
         .then(admin_found => {
            // *Checking if there is any result:
            if(admin_found){
               // *If there is:
               // *Salting and hashing the given password:
               const hashed_given_password = cry.hashSync('sha256', admin_found.salt + password).toString('hex');
               // *Checking if the hashes matches:
               // TODO do this with length constant comparison:
               if(admin_found.password === hashed_given_password)
                  // *If they match:
                  // *Returning the admin user instance:
                  return admin_found;
            }

            // *Throwing a kunlun error, as the admin check have failed:
            throw new KunlunError(KUNLUN_ERR_CODES.ADMIN.CHECK, 'Invalid admin credentials');
         });
   }



   /**
    * Creates a new admin user in the database
    * @param {Admin} admin     The admin user that is attempting to create a new admin
    * @param {String} username The new admin username
    * @param {String} password The new admin password
    */
   function add(admin, username, password){
      // *Rejecting into an kunlun error, if the password is not a string:
      if(typeof password !== 'string')
         return Promise.reject(new KunlunError(KUNLUN_ERR_CODES.ADMIN.PASSWORD.TYPE, 'The password must be a string'));


      // TODO create an '_admin' field in Admin collection, so the admin creator can be referenced
      // TODO or just create a separated logging collection for that

      // *Generating the password hash salt:
      const salt = uuid.v4();

      // *Hashing the password using the generated salt:
      const hashed_password = cry.hashSync('sha256', salt + password).toString('hex');

      // *Adding a new admin user:
      return new Admin({ username, password: hashed_password, salt })
         .save()
         .then(admin_created => {
            return { id: admin_created._id };
         })
         .catch(err => {
            // *Checking if the error has been thrown by the database:
            if(err.name === 'MongoError'){
               // *If it has:
               // *Checking the error code:
               switch(err.code){
                  // *If the username already exists:
                  case 11000: throw new KunlunError(KUNLUN_ERR_CODES.ADMIN.USERNAME.EXISTS);
               }
            }

            // *Checking if it is a validation error:
            if(err.name === 'ValidationError'){
               // *If it has:
               // *Checking the error kinds for username:
               if(err.errors.username.kind === 'required')
                  throw new KunlunError(KUNLUN_ERR_CODES.ADMIN.USERNAME.MISSING);
            }

            // *Throwing the error again, as it wasn't expected:
            throw err;
         });
   }



   // *Returning the routes:
   return { add, check };
};
