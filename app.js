const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const https = require('https');
const port = process.env.PORT || 3000;

// Load environment variables from .env file during development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/signup.html');
});

app.post('/', (req, res) => {
  const fname = req.body.fname;
  const lname = req.body.lname;
  const email = req.body.email;

  const data = {
    members: [
      {
        email_address: email,
        status: 'subscribed',
        merge_fields: {
          FNAME: fname,
          LNAME: lname
        }
      }
    ]
  };

  const jsonData = JSON.stringify(data);

  const mailchimpApiKey = process.env.MAILCHIMP_API_KEY; // Use environment variable
  const listId = 'a500b9e454';
  const datacenter = 'us12';

  const url = `https://${datacenter}.api.mailchimp.com/3.0/lists/${listId}`;
  const options = {
    method: 'POST',
    auth: `anystring:${mailchimpApiKey}`
  };

  const request = https.request(url, options, function (response) {
    let val = '';

    response.on('data', function (chunk) {
      val += chunk;
    });

    response.on('end', function () {
      const result = JSON.parse(val);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        // Successful response, contact added to the audience
        console.log('Successfully subscribed:', result);
      } else {
        // Unsuccessful response, handle the failure
        console.error('Mailchimp API Error:', result);
        res.sendFile(__dirname + '/failure.html');
      }
    });

    request.on('error', function (error) {
      console.error('API Request Error:', error);
      res.sendFile(__dirname + '/failure.html');
    });
  });

  request.write(jsonData);
  request.end();
});

app.post('/failure', (req, res) => {
  res.redirect('/');
});

app.listen(port, function () {
  console.log(`server is up and running on ${port}`);
});
