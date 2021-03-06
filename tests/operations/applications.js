// *Getting the needed modules:
const uuid = require('uuid');
const { expect } = require('chai');
const kunlun = require('../tools/kunlun-service');
const KunlunError = require('../../libs/errors/kunlun');



describe('Application', function(){

   const applications_to_be_removed = [];


   after('Removing created applications', function(){
      // *Increasing the timeout for this task:
      this.timeout(10000);
      const tasks = [];
      for(application_name of applications_to_be_removed){
         tasks.push(kunlun.get().applications.remove(undefined, application_name));
      }
      return Promise.all(tasks);
   });


   describe('Creating', function(){

      it('Registers a valid application', function(){
         // *Generating a random name:
         const name = uuid.v4();

         // *Adding a valid application:
         return kunlun.get().applications.add(undefined, name)
            .then(result => {
               // *Adding to the list of applications to be removed:
               applications_to_be_removed.push(name);
               // *Expecting the result to have an id:
               expect(result).to.have.property('id');
               // *Expecting the result to have the generated token:
               expect(result).to.have.property('token');
               expect(result.token).to.match(/^[a-f0-9]{8}\-[a-f0-9]{4}\-4[a-f0-9]{3}\-[a-f0-9]{4}\-[a-f0-9]{12}$/i);
            });
      });


      describe('Name validation', function(){

         it('Fails if no name is supplied', function(){
            // *Setting the name as undefined:
            const name = undefined;

            // *Adding an application without name:
            return kunlun.get().applications.add(undefined, name)
            // *Throwing an error, as this operation should not have been successful:
            .then(() => Promise.reject(new Error()))
            .catch(err => {
               expect(err).to.be.instanceof(KunlunError);
               expect(err.code).to.be.equal('EAPPLICATION.NAME.MISSING');
            });
         });


         it('Fails if the name is too long', function(){
            // *Setting a long name:
            const name = '012345678901234567890123456789012345678901234567890123456789';

            // *Adding an application with a long name:
            return kunlun.get().applications.add(undefined, name)
            // *Throwing an error, as this operation should not have been successful:
            .then(() => Promise.reject(new Error()))
            .catch(err => {
               expect(err).to.be.instanceof(KunlunError);
               expect(err.code).to.be.equal('EAPPLICATION.NAME.INVALID');
            });
         });


         it('Fails if the name already exists', function(){
            // *Generating a random name:
            const name = uuid.v4();

            // *Adding a valid application:
            return kunlun.get().applications.add(undefined, name)
               .then(result => {
                  // *Adding to the list of applications to be removed:
                  applications_to_be_removed.push(name);
                  // *Trying to add the application again:
                  return kunlun.get().applications.add(undefined, name)
                     // *Throwing an error, as this operation should not have been successful:
                     .then(() => Promise.reject(new Error()))
                     .catch(err => {
                        expect(err).to.be.instanceof(KunlunError);
                        expect(err.code).to.be.equal('EAPPLICATION.NAME.EXISTS');
                     });
               });
         });

      });

   });


   describe('Authenticating', function(){

      it('Authenticates using the correct token', function(){
         // *Generating a random name:
         const name = uuid.v4();

         // *Adding a valid application:
         return kunlun.get().applications.add(undefined, name)
            .then(result => {
               // *Adding to the list of applications to be removed:
               applications_to_be_removed.push(name);
               // *Trying to authenticate using the correct token:
               return kunlun.get().applications.authenticate(name, result.token);
            });
      });


      it('Does\'t authenticate if using an invalid token', function(){
         // *Generating a random name:
         const name = uuid.v4();

         // *Adding a valid application:
         return kunlun.get().applications.add(undefined, name)
            .then(result => {
               // *Adding to the list of applications to be removed:
               applications_to_be_removed.push(name);
               // *Generating an invalid token:
               const invalid_token = {};
               // *Trying to authenticate using an invalid token:
               return kunlun.get().applications.authenticate(name, invalid_token)
                  // *Throwing an error, as this operation should not have been successful:
                  .then(() => Promise.reject(new Error()))
                  .catch(err => {
                     expect(err).to.be.instanceof(KunlunError);
                     expect(err.code).to.be.equal('EAPPLICATION.TOKEN.INVALID');
                  });
            });
      });


      it('Does\'t authenticate if using an incorrect token', function(){
         // *Generating a random name:
         const name = uuid.v4();

         // *Adding a valid application:
         return kunlun.get().applications.add(undefined, name)
            .then(result => {
               // *Adding to the list of applications to be removed:
               applications_to_be_removed.push(name);
               // *Generating an incorrect token:
               const incorrect_token = uuid.v4();
               // *Trying to authenticate using an incorrect token:
               return kunlun.get().applications.authenticate(name, incorrect_token)
                  // *Throwing an error, as this operation should not have been successful:
                  .then(() => Promise.reject(new Error()))
                  .catch(err => {
                     expect(err).to.be.instanceof(KunlunError);
                     expect(err.code).to.be.equal('EAPPLICATION.TOKEN.INCORRECT');
                  });
            });
      });

   });


   describe('Removing with admin', function(){

      it('Removes an application by its name', function(){
         // *Increasing the timeout for this task:
         this.timeout(5000);
         // *Generating a random name:
         const name = uuid.v4();

         // *Adding a valid application:
         return kunlun.get().applications.add(undefined, name)
            .then(result => kunlun.get().applications.remove(undefined, name));
            // TODO check if the database is being removed as well
      });


      it('Fails if the application name doesn\'t exist', function(){
         // *Generating a random name:
         const name = uuid.v4();

         // *Adding a valid application:
         return kunlun.get().applications.add(undefined, name)
            // *Removing a application that doesn't exist:
            .then(result => kunlun.get().applications.remove(undefined, name + '123'))
            // *Throwing an error, as this operation should not have been successful:
            .then(() => Promise.reject(new Error()))
            .catch(err => {
               // *Adding to the list of applications to be removed:
               applications_to_be_removed.push(name);
               expect(err).to.be.instanceof(KunlunError);
               expect(err.code).to.be.equal('EAPPLICATION.NAME.NOTFOUND');
            });
      });

   });

});
