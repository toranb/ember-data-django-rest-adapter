App = Ember.Application.create({
  rootElement: '#ember'
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
    other: DS.belongsTo('other')
});

App.Other = DS.Model.extend({
  hat: DS.attr('string'),
  tags: DS.hasMany('tag'),
  speakers: DS.hasMany('speaker'),
  ratings: DS.hasMany('rating')
});

App.Speaker.reopen({
    becameError: function(errors) {
        var model = this.constructor.typeKey;
        alert("operation failed for model: " + model);
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
            //to create with a single parent use the below hash instead
            //var hash = {name: name, location: location, session: session};
            self.store.createRecord('speaker', hash).save();
          });
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
  this.resource("sessions", { path : "/" });
  this.resource("others", { path : "/others" });
  this.resource("other", { path : "/other/:other_id" });
  this.resource("associations", { path : "/associations" });
  this.resource("speakers", { path : "/speakers" });
  this.resource("ratings", { path : "/ratings" });
  this.resource("session", { path : "/session/:session_id" });
  this.resource("speaker", { path : "/speaker/:speaker_id" });
});

App.ApplicationAdapter = DS.DjangoRESTAdapter.extend({
    namespace: 'api'
});
