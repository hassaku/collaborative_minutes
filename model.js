// Logs -- {      text: String,
//           spearkers: [String, ...],
//           timestamp: Number,
//          created_at: String}
Logs = new Meteor.Collection("logs");

// Users -- {      name: String,
//                input: String}
Users = new Meteor.Collection("users");

if (Meteor.is_server) {
    // Publish all items 
    Meteor.publish('logs', function () {
      return Logs.find();
    });

    Meteor.publish('users', function () {
      return Users.find();
    });
}
