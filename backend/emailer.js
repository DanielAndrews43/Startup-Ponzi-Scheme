const send = require('gmail-send');

module.exports = {
    sendMessage: function sender(text) {
        send({
          user:    process.env.GMAIL_USER,
          pass:    process.env.GMAIL_PASS,      
          to:      ['danielandrews@berkeley.edu'],  
          subject: 'New Ideas Created!',
          text:    text
        })();
    }
};