// Client-side JavaScript, bundled and sent to client.

// Name of currently selected speaker 
Session.set('speaker_list', null);

// When adding speaker to a log, ID of the log
Session.set('editing_addspeaker', null);

// When editing log text, ID of the log
Session.set('editing_itemname', null);

// checkbox value for auto scroll
Session.set('auto_scroll', true);

Meteor.startup(function () {
  //var user_id = Users.insert({name: 'Anonymous', input: ''});
  var user_id = Users.insert({name: '', input: ''});
  Session.set('user_id', user_id);
  Users.update(Session.get('user_id'), {$set: {name: user_id.substring(0,8)}});

  Meteor.autosubscribe(function () {
    Meteor.subscribe('users');
    Meteor.subscribe('logs');
  });

  Meteor.setInterval(function() {
    if (Session.get('auto_scroll')) {
        scroll_bottom(1000);
    }
  }, 2000);
});

////////// Helpers for in-place editing //////////
// Returns an event_map key for attaching "ok/cancel" events to a text input (given by selector)
var okcancel_events = function (selector) {
  return 'keyup '+selector+', keydown '+selector+', focusout '+selector;
};

// Creates an event handler for interpreting "escape", "return", and "blur"
// on a text field and calling "ok" or "cancel" callbacks.
var make_okcancel_handler = function (options) {
  var ok = options.ok || function () {};
  var cancel = options.cancel || function () {};

  return function (evt) {
    if (evt.type === "keydown" && evt.which === 27) {
      // escape = cancel
      cancel.call(this, evt);

    } else if (evt.type === "keydown" && evt.which === 13) {
      // blur/return/enter = ok/submit if non-empty
      var value = String(evt.target.value || "");
      if (value)
        ok.call(this, value, evt);
      else
        cancel.call(this, evt);
    }
  };
};

// Finds a text input in the DOM by id and focuses it.
var focus_field_by_id = function (id) {
  var input = document.getElementById(id);
  if (input) {
    input.focus();
    input.select();
  }
};

function scroll_bottom(speed) {
  // meteor add jquery 
  var scroll_target = $('#main-pane');
  var scroll_value = scroll_target.height();
  scroll_target.animate({ scrollTop: scroll_target.scrollTop() + scroll_value}, speed);
};

function data_format() {
    dd = new Date();
    hh = dd.getHours();
    mm = dd.getMinutes();
    ss = dd.getSeconds();
    if (hh < 10) { hh = "0" + hh; }
    if (mm < 10) { mm = "0" + mm; }
    if (ss < 10) { ss = "0" + ss; }
    return hh + ":" + mm + ":" + ss;
};

Template.logs.events = {
  // status which others are inputting data
  'keyup input#new-log': function (evt) {
    var value = $('input#new-log').val().trim();
    Users.update(Session.get('user_id'), {$set: {input: value}});
  }
};


Template.logs.events[ okcancel_events('#new-log') ] =
  make_okcancel_handler({
    ok: function (text, evt) {
      scroll_bottom(5000);

      var speaker = Session.get('speaker_list');
      // clear status of inputting data
      Users.update(Session.get('user_id'), {$set: {input: ''}});
      Logs.insert({
        text: text,
        timestamp: (new Date()).getTime(),
        created_at: data_format(),
        speakers: speaker ? [speaker] : []
      });
      evt.target.value = '';
    }
  });

Template.logs.pending = function () {
     var users = Users.find({_id: {$ne: Session.get('user_id')}, input: {$ne: ''}});
     return users;
};

Template.logs.count = function () {
     //var users = Users.find({});
     var users = Users.find({_id: {$ne: Session.get('user_id')}, input: {$ne: ''}});
     return users.count();
};

Template.logs.logs = function () {
  // Determine which logs to display in main pane,
  var speaker_list = Session.get('speaker_list');
  return Logs.find({}, {sort: {timestamp: 1}});
};

Template.log_item.speaker_objs = function () {
  var log_id = this._id;
  return _.map(this.speakers || [], function (speaker) {
    return {log_id: log_id, speaker: speaker};
  });
};

Template.log_item.editing = function () {
  return Session.equals('editing_itemname', this._id);
};

Template.log_item.adding_speaker = function () {
  return Session.equals('editing_addspeaker', this._id);
};

Template.log_item.created_at = function () {
  return this.created_at;
};

Template.log_item.events = {
  'click .destroy': function () {
    Logs.remove(this._id);
  },

  'click .addspeaker': function (evt) {
    Session.set('editing_addspeaker', this._id);
    Meteor.flush(); // update DOM before focus
    focus_field_by_id("editspeaker-input");
  },

  //'dblclick .display .log-text': function (evt) {
  'click .display .log-text': function (evt) {
    Session.set('editing_itemname', this._id);
    Meteor.flush(); // update DOM before focus
    focus_field_by_id("log-input");
  }
};

Template.log_item.events[ okcancel_events('#log-input') ] =
  make_okcancel_handler({
    ok: function (value) {
      Logs.update(this._id, {$set: {text: value}});
      Session.set('editing_itemname', null);
    },
    cancel: function () {
      Session.set('editing_itemname', null);
    }
  });

Template.log_item.events[ okcancel_events('#editspeaker-input') ] =
  make_okcancel_handler({
    ok: function (value) {
      Logs.update(this._id, {$addToSet: {speakers: value}});
      Session.set('editing_addspeaker', null);
      Session.set('speaker_list', value);
    },
    cancel: function () {
      Session.set('editing_addspeaker', null);
    }
  });

Template.log_speaker.events = {
  'click .remove': function (evt) {
    var speaker = this.speaker;
    var id = this.log_id;

    evt.target.parentNode.style.opacity = 0;
    // wait for CSS animation to finish
    Meteor.setTimeout(function () {
      Logs.update({_id: id}, {$pull: {speakers: speaker}});
    }, 300);
  }
};

///////////////////////////////
// <div id="top-speaker-list">
Template.speaker_list.speakers = function () {
    var speaker_infos = []; 
    var total_count = 0;

    Logs.find().forEach(function (log) {
        _.each(log.speakers, function (speaker) {
            var speaker_info = _.find(speaker_infos, function (x) { return x.speaker === speaker; }); 
            if (! speaker_info) {
                speaker_infos.push({speaker: speaker, count: 1});
            } else {
                speaker_info.count++;
            }
        }); 

        total_count++;
    }); 

    speaker_infos = _.sortBy(speaker_infos, function (x) { return x.speaker; }); 
    return speaker_infos;
}; 

Template.speaker_list.scroll_checkbox = function () {
    return Session.get('auto_scroll') ? 'checked="checked"' : '';
};

Template.speaker_list.events = {
  'click .clear': function (evt) {
    if (window.confirm('Are you sure you want to delete all?')) {
        Meteor.call("clearAllLogs");
        Session.set('speaker_list', null);
    }
  },
  'click .check': function () {
    Session.set('auto_scroll', !Session.get('auto_scroll'));
  }
};

Template.speaker_item.speaker_text = function () {
  return this.speaker;
};

Template.speaker_item.selected = function () {
  return Session.equals('speaker_list', this.speaker) ? 'selected' : '';
};


Template.speaker_item.events = {
  'mousedown': function () {
    if (Session.equals('speaker_list', this.speaker)) {
      Session.set('speaker_list', null);
    } else {
      Session.set('speaker_list', this.speaker);
    }
  }
};

