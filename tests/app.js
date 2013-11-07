App = Ember.Application.create({
  rootElement: '#ember'
});

App.SillyTransform = DS.Transform.extend({
  text: "SILLYTRANSFORM",
  deserialize: function(serialized) {
    return serialized + this.text;
  },
  serialize: function(deserialized) {
    return deserialized.slice(0, deserialized.length - this.text.length);
  }
});

App.ObjectTransform = DS.Transform.extend({
  deserialize: function(serialized) {
    return Ember.isEmpty(serialized) ? {} : JSON.parse(serialized);
  },
  serialize: function(deserialized) {
    return Ember.isNone(deserialized) ? '' : JSON.stringify(deserialized);
  }
});

App.Preserialized = DS.Model.extend({
  // This will contain JSON that will be deserialized by the App.ObjectTransform.
  // If it deserializes to an array with anything other than numbers it will be 
  // incorrectly interpreted by extractDjangoPayload as an embedded record.
  config: DS.attr('object')
});

// handlebars helper that checks if the provided input is a Date object
Ember.Handlebars.registerBoundHelper('isInstanceOfDate', function(input) {
  return (input instanceof Date) ? "true" : "false";
});

App.Timestamp = DS.Model.extend({
  start: DS.attr('isodate')
});

App.Transformer = DS.Model.extend({
  transformed: DS.attr('silly')
});

App.CamelUrl = DS.Model.extend({
  test: DS.attr('string')
});

App.Camel = DS.Model.extend({
  camelCaseAttribute: DS.attr('string'),
  camelCaseRelationship: DS.hasMany('tag', { async: true })
});

App.Location = DS.Model.extend({
  name:DS.attr('string')
});

App.Session = DS.Model.extend({
  name: DS.attr('string'),
  room: DS.attr('string'),
  tags: DS.hasMany('tag', {async: true }),
  speakers: DS.hasMany('speaker', { async: true }),
  ratings: DS.hasMany('rating', { async: true })
});

App.Speaker = DS.Model.extend({
    name: DS.attr('string'),
    location: DS.attr('string'),
    association: DS.belongsTo('association'),
    personas: DS.hasMany('persona', { async: true }),
    session: DS.belongsTo('session'),
    zidentity: DS.belongsTo('user'),
    other: DS.belongsTo('other'),
    errors: ''
});

App.Other = DS.Model.extend({
  hat: DS.attr('string'),
  tags: DS.hasMany('tag'),
  speakers: DS.hasMany('speaker'),
  ratings: DS.hasMany('rating'),
  location: DS.belongsTo('location')
});

App.Speaker.reopen({
    becameError: function(errors) {
        var model = this.constructor.typeKey;
        this.set('errors', "operation failed for model: " + model);
    }
});

App.Tag = DS.Model.extend({
  description: DS.attr('string')
});

App.Rating = DS.Model.extend({
  score: DS.attr('number'),
  feedback: DS.attr('string'),
  session: DS.belongsTo('session'),
  other: DS.belongsTo('other')
});

App.Association = DS.Model.extend({
  name: DS.attr('string'),
  speakers: DS.hasMany('speaker', { async: true})
});

App.User = DS.Model.extend({
    username: DS.attr('string'),
    aliases: DS.hasMany('speaker', { async: true})
});

App.Company = DS.Model.extend({
    name: DS.attr('string'),
    sponsors: DS.hasMany('sponsor', { async: true}),
    persona: DS.belongsTo('persona')
});

App.Persona = DS.Model.extend({
    nickname: DS.attr('string'),
    speaker: DS.belongsTo('speaker'),
    company: DS.belongsTo('company')
});

App.Sponsor = DS.Model.extend({
    name: DS.attr('string'),
    company: DS.belongsTo('company')
});

App.OthersRoute = Ember.Route.extend({
  model: function() {
    return this.store.find('other');
  }
});

App.RatingsRoute = Ember.Route.extend({
  model: function() {
    return this.store.find('rating');
  }
});

App.PreserializedRoute = Ember.Route.extend({
  model: function() {
    return this.store.find('preserialized');
  }
});

App.TimestampsRoute = Ember.Route.extend({
  model: function() {
    return this.store.find('timestamp');
  }
});

App.TransformersRoute = Ember.Route.extend({
  model: function() {
    return this.store.find('transformer');
  }
});

App.CamelUrlsRoute = Ember.Route.extend({
  model: function() {
    return this.store.find('camelUrl');
  }
});

App.CamelsRoute = Ember.Route.extend({
  model: function() {
    return this.store.find('camel');
  }
});

App.SessionsRoute = Ember.Route.extend({
  model: function() {
    return this.store.find('session');
  }
});

App.SpeakersRoute = Ember.Route.extend({
  model: function() {
      return this.store.find('speaker', {name: 'Joel Taddei'});
    }
});

App.AssociationsRoute = Ember.Route.extend({
  model: function() {
      return this.store.find('association');
    }
});

App.SpeakerController = Ember.ObjectController.extend({
  actions: {
      updateSpeaker: function(model) {
          model.save();
      }
  }
});

App.OtherController = Ember.ObjectController.extend({
  actions: {
      addRating: function(other) {
        var score = this.get('score');
        var feedback = this.get('feedback');
        if (score === undefined || feedback === undefined || score.trim() === "" || feedback.trim() === "") {
          return;
        }
        var rating = { score: score, feedback: feedback, other: other};
        this.store.createRecord('rating', rating).save();
        this.set('score', '');
        this.set('feedback', '');
      }
  }
});

App.SessionController = Ember.ObjectController.extend({
  actions: {
      addSpeaker: function(session) {
          var self = this;
          var name = this.get('speaker');
          var location = this.get('location');
          this.store.find('user', 1).then(function(user) {
            //to simulate a record create with multiple parents
            var hash = {zidentity: user, name: name, location: location, session: session};
            self.store.createRecord('speaker', hash).save();
          });
      },
      addSpeakerWithUserSingleParent: function(session) {
          var self = this;
          var name = this.get('speaker');
          var location = this.get('location');
          this.store.find('user', 1).then(function(user) {
            //to simulate a record create with single user parent
            var hash = {zidentity: user, name: name, location: location};
            self.store.createRecord('speaker', hash).save();
          });
      },
      addSpeakerWithSingleParent: function(session) {
          var self = this;
          var name = this.get('speaker');
          var location = this.get('location');
          //to simulate a record create with just a single parent
          var hash = {name: name, location: location, session: session};
          self.store.createRecord('speaker', hash).save();
      },
      addRating: function(session) {
        var score = this.get('score');
        var feedback = this.get('feedback');
        if (score === undefined || feedback === undefined || score.trim() === "" || feedback.trim() === "") {
          return;
        }
        var rating = { score: score, feedback: feedback, session: session};
        this.store.createRecord('rating', rating).save();
        this.set('score', '');
        this.set('feedback', '');
      },
      deleteRating: function(rating) {
          rating.deleteRecord();
          rating.save();
      }
  }
});

App.Router.map(function() {
  this.resource("sessions", { path : "/sessions" });
  this.resource("others", { path : "/others" });
  this.resource("other", { path : "/other/:other_id" });
  this.resource("associations", { path : "/associations" });
  this.resource("speakers", { path : "/speakers" });
  this.resource("ratings", { path : "/ratings" });
  this.resource("session", { path : "/session/:session_id" });
  this.resource("speaker", { path : "/speaker/:speaker_id" });
  this.resource("camels", { path : "/camels" });
  this.resource("camelUrls", { path : "/camelUrls" });
  this.resource("transformers", { path : "/transformers" });
  this.resource("tag", { path : "/tag/:tag_id" });
  this.resource("user", { path : "/user/:user_id" });
  this.resource("preserialized", { path: "/preserialized" });
  this.resource("timestamps", { path : "/timestamps" });
});

App.ApplicationAdapter = DS.DjangoRESTAdapter.extend({
    namespace: 'api'
});

//monkey patch the ajax method for testing
var ajaxUrl, ajaxType, ajaxHash;
DS.DjangoRESTAdapter.reopen({
    ajax: function(url, type, hash) {
        ajaxUrl = url;
        ajaxType = type;
        ajaxHash = hash;
        hash = hash || {};
        hash.cache = false;
        return this._super(url, type, hash);
    }
});
