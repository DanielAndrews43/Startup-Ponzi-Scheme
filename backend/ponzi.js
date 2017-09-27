'use strict';

const path    = require('path');
const mysql   = require('mysql');
const emailer = require('./emailer')

const make_mysql_connection = function() {
    const connection = mysql.createConnection(process.env.JAWSDB_URL);
    connection.connect();

    return connection;
}

const increment_index = function(index) {
    const connection = make_mysql_connection();

    connection.query('UPDATE `index` SET `n` = `n` + 1;', function(err, rows, fields) {
        if (err) console.log('MYSQL update index value fail: ' + err);
        connection.end();
    });
}

const get_index = function(callback) {

    const connection = make_mysql_connection();
    var index = 1;

    connection.query('CREATE TABLE IF NOT EXISTS `index` (`n` int DEFAULT 1);', function(err, rows, fields) {

        if (err) {
            console.log('MYSQL create index table fail: ' + err);
            callback(err);
            return;
        }

        connection.query('SELECT `n` FROM `index`', function(err, rows, fields) {
            if (err) {
                console.log('MYSQL select index fail: ' + err);
            } else if (!rows[0]) {
                console.log('MYSQL no index in the table');
                callback(null, index);
            } else {
                callback(null, rows[0].n)
            }

            connection.end();
        });
    });
}

let submitted = new Set();
let lastIdea = 'App where you have to write 100 ideas a day, otherwise its all deleted';
const store_idea = function(idea) {
    //Max length should be 1000 characters
    console.log('Idea being stored: ' + idea);
    if (idea.length > 1000) {
        idea = idea.substring(0,1000);
    }

    //keep out double clicking or auto-fill
    if (submitted.has(idea)) {
        return;
    } else {
        submitted.add(idea);
    }

    const connection = make_mysql_connection();
    const create_query = 'CREATE TABLE IF NOT EXISTS `ideas` '
    const params_query = '(`index` int primary key NOT NULL AUTO_INCREMENT, `idea` text);';

    connection.query(create_query + params_query, function(err, rows, fields) {
        if (err) console.log('MYSQL create ideas table fail: ' + err);

        const new_idea = {idea: idea};
        connection.query('INSERT INTO `ideas` SET ?', new_idea, function(err, result) {
            if (err) console.log('MYSQL insert idea fail: ' + err);
            connection.end();
        });
    });
}

const get_idea = function(callback) {
    get_index(function(err, index) {
        if (err) {
            callback(err);
            return
        }
        const connection = make_mysql_connection();
        const get_query = 'SELECT `idea` FROM `ideas` WHERE `index` =' + index;

        connection.query(get_query, function(err, rows, fields) {
            if (err) {
                console.log('MYSQL select idea fail: ' + err);
                callback(err);
            } else {
                if (rows[0]) {
                    callback(null, rows[0].idea);
                    increment_index();
                } else {
                    callback(null, lastIdea);
                }
                connection.end();
            }
        });
    });
}

module.exports = {
    handler: function input_to_output(ideas, callback) {
        //Check if these ideas have already been submitted
        let flag = false;
        if (submitted.has(ideas.one) || submitted.has(ideas.two)) {
            flag = true;
        }

        if (ideas.one.length < 10 || ideas.one.split(' ').length <= 2 || ideas.two.length < 10 || ideas.two.split(' ').length <= 2) {
          flag = true;
          callback(null, 'Please enter at least 10 characters for each of your ideas! That way we won\'t be spammed.');
          return;
        }

        //add the two ideas to the databse
        if (ideas.one != null) {
            store_idea(ideas.one);
        }
        if (ideas.two != null) {
            store_idea(ideas.two);
        }

        let emailMessage = 'New Ideas:\n\n' + '1) ' + ideas.one + '\n' + '2) ' + ideas.two;
        emailer.sendMessage(emailMessage);

        if (flag) {
          console.log('Had ideas, not returning a new one')
          callback(null, lastIdea);
          return;
        }

        return get_idea(function(err, data) {
            if (err) {
                console.log('Could not get idea:',err);
                callback(err);
            } else {
                callback(null, data);
            }
        });
    }
}
