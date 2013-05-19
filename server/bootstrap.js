// if the database is empty on server start, create some sample data.
Meteor.startup(function () {
    // initialize users
    Users.remove([]);

    console.log('start')
    // server information
     Npm.require('dns').lookup(
      Npm.require('os').hostname(), function (err, add, fam) {
        console.log('\n======================================');
        console.log('server ip address : ' + add + ':3000');
        console.log('======================================\n');
      }   
    );   

    // save file
    dd    = new Date();
    year  = dd.getYear();
    mouth = dd.getMonth() + 1;
    day   = dd.getDate();
    hour  = dd.getHours();
    min   = dd.getMinutes();
    if (year  < 2000) { year += 1900; }
    if (mouth < 10)   { mouth = "0" + mouth; }
    if (day   < 10)   { day = "0" + day; }
    if (hour  < 10)   { hour = "0" + hour; }
    if (min < 10)     { min = "0" + min; }
    var filename = year + '-' + mouth + '-' + day + '_' + hour + min + '.txt'
    var fs = Npm.require('fs');
    fs.writeFileSync( 'save/' + filename , '' );

    // auto save
    Meteor.setInterval(function() {
        var fs = Npm.require('fs');
        // print
        str = '';
        Logs.find().forEach(function (log) {
            _.each(log.speakers, function(speaker) {
                str += speaker + ' ';
            });
            str += '\t: ' + log.text + ' (' + log.created_at + ')\n';
        });
        fs.writeFileSync( 'save/' + filename , str );

        console.log('> ' + filename + ' is saved at ' + (new Date()));
      }, 60 * 1000);
});
