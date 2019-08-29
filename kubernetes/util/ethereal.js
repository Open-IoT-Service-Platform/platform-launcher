'use strict';
const nodemailer = require('nodemailer');
var fs = require('fs');

var outputFile = ".env"
var args = process.argv.slice(2);

if ( args[0] ) {
    outputFile = args[0];
}

nodemailer.createTestAccount((err, account) => {
    if (!err) {
        fs.writeFileSync(outputFile,  'export SMTP_HOST='+account.smtp.host+'\n');
        fs.appendFileSync(outputFile, 'export SMTP_PORT='+account.smtp.port+'\n');
        fs.appendFileSync(outputFile, 'export SMTP_USERNAME='+account.user+'\n');
        fs.appendFileSync(outputFile, 'export SMTP_PASSWORD='+account.pass+'\n');
        fs.appendFileSync(outputFile, 'export IMAP_USERNAME='+account.user+'\n');
        fs.appendFileSync(outputFile, 'export IMAP_PASSWORD='+account.pass+'\n');
        fs.appendFileSync(outputFile, 'export IMAP_HOST='+account.imap.host+'\n');
        fs.appendFileSync(outputFile, 'export IMAP_PORT='+account.imap.port+'\n');
    }
})

	