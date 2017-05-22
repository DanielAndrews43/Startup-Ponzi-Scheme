'use strict';

const path  = require('path');
const mysql = require('mysql');

const make_mysql_connection = function() {
    const connection = mysql.createConnection(process.env.JAWSDB_URL);
    connection.connect();

    return connection;
}

const increment_index = function(index) {
    const connection = make_mysql_connection();

    //Increment index by 1
    connection.query('UPDATE `index` SET `n` = `n` + 1;', function(err, rows, fields) {
        if (err) console.log('MYSQL update index value fail');
    });

    connection.end();
}

const get_index = function() {
    let index = 1;

    const connection = make_mysql_connection();

    //Create new table if none
    connection.query('CREATE TABLE IF NOT EXISTS `index` (`n` int DEFAULT 1);', function(err, rows, fields) {
        if (err) console.log('MYSQL create index table fail');
    });

    //Get the value of current index
    connection.query('SELECT `n` FROM `index`', function(err, rows, fields) {
        if (err) console.log('MYSQL select index fail');
        index = rows[0].n;
    });

    connection.end();

    return index
}

const store_idea = function(idea) {
    //save idea to DB
    //Max length should be 1000 characters
    if (idea.length > 1000) {
        idea = idea.substring(0,1000);
    }

    const connection = make_mysql_connection();
    const create_query = 'CREATE TABLE IF NOT EXISTS `ideas` (`index` int NOT NULL AUTO_INCREMENT, `idea` text);';
    connection.query(create_query, function(err, rows, fields) {
        if (err) console.log('MYSQL create ideas table fail');

        const new_idea = {idea: idea};
        connection.query('INSERT INTO `ideas` SET ?', new_idea, function(err, result) {
            if (err) console.log('MYSQL insert idea fail');
        });
    });
    connection.end();
}

const get_idea = function() {
    //get idea at index from DB
    var index = get_index();

    //get idea
    const connection = make_mysql_connection();
    const get_query = 'SELECT `text` FROM `ideas` WHERE `index` = ?';

    var res = ''
    connection.query(get_query, index, function(err, rows, fields) {
        if (err) console.log('MYSQL select idea fail');

        //increment index
        increment_index();
        res = rows[0].idea;
    });
    return res;
}

module.exports = {
    handler: function input_to_output(ideas) {
        //add the two ideas to the databse
        let one = ideas.one;
        let two = ideas.two;

        store_idea(one);
        store_idea(two);

        return get_idea();
    }
}